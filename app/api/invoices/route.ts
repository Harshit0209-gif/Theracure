import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus, TransactionStatus } from "@prisma/client";
import { storageService } from "@/lib/services/storage-factory";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";
import { sendSMSNotification } from "@/config/smsConfig";
import { getSession } from "@/lib/auth/session-provider";
import { withRetry } from "@/lib/prisma";

const ALLOWED_SORT_FIELDS = [
  "date",
  "totalAmount",
  "amountPaid",
  "createdAt",
  "status",
] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");
    const rawSortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(
      rawSortBy as SortField,
    )
      ? (rawSortBy as SortField)
      : "date";

    const where: any = {};

    if (status) where.status = status;
    if (patientId) where.patientId = patientId;
    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { patient: { patientName: { contains: search, mode: "insensitive" } } },
        { patient: { id: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [invoices, totalCount] = await withRetry(() =>
      Promise.all([
        prisma.invoice.findMany({
          where,
          include: {
            patient: {
              select: { id: true, patientName: true, email: true, phone: true },
            },
            invoiceItems: {
              select: {
                invoiceId: true,
                serviceId: true,
                serviceName: true,
                priceAtPurchase: true,
                quantity: true,
                description: true,
                category: true,
              },
            },
            transactions: { orderBy: { transactionDate: "desc" } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.invoice.count({ where }),
      ]),
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: invoices,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Invoice GET error:", msg);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
        detail: process.env.NODE_ENV !== "production" ? msg : undefined,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    const body = await request.json();

    const {
      patientInfo,
      invoiceDetails,
      selectedServices,
      paymentDetails,
      createdBy,
    } = body;

    const patient = await prisma.patient.findUnique({
      where: { id: patientInfo.id },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 },
      );
    }

    const status =
      paymentDetails?.balance > 0 ? InvoiceStatus.DUE : InvoiceStatus.PAID;

    const totalAmount = parseFloat(
      (paymentDetails?.totalAmount || 0).toFixed(2),
    );
    const subTotal = parseFloat((paymentDetails?.subTotal || 0).toFixed(2));
    const rawAmountPaid = parseFloat(
      (paymentDetails?.amountPaid || 0).toFixed(2),
    );

    if (rawAmountPaid > totalAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount paid (₹${rawAmountPaid}) cannot exceed total amount (₹${totalAmount})`,
        },
        { status: 400 },
      );
    }

    const amountPaid = rawAmountPaid;

    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceDetails.id || undefined,
        patientId: patientInfo?.id,
        status,
        totalAmount,
        subTotal,
        offer: paymentDetails?.offer || 0,
        amountPaid,
        paymentMethod: invoiceDetails?.paymentMethod || "CASH",
        createdBy: session?.user?.email || createdBy,
        notes: invoiceDetails.notes || "",
      },
      include: {
        patient: {
          select: { id: true, patientName: true, email: true, phone: true },
        },
      },
    });

    if (selectedServices && selectedServices.length > 0) {
      await prisma.invoiceItem.createMany({
        data: selectedServices.map((service: any) => ({
          invoiceId: invoiceDetails.id,
          serviceId: service.id,
          serviceName: service.name,
          priceAtPurchase: parseFloat((service.price || 0).toFixed(2)),
          quantity: service.quantity || 1,
          description: service.description || "",
          category: service.category || "General",
        })),
      });
    }

    if (amountPaid > 0) {
      await prisma.transaction.create({
        data: {
          invoiceId: invoiceDetails.id,
          amount: amountPaid,
          paymentMethod: invoiceDetails.paymentMethod || "Cash",
          transactionDate: new Date().toISOString(),
          status: TransactionStatus.SUCCESS,
        },
      });
    }

    let pdfPath = null;
    try {
      const pdfBuffer = await generateInvoicePDF({
        ...body,
        invoiceDetails: { ...body.invoiceDetails, status },
      });
      const fileName = `invoices/${invoiceDetails.id}.pdf`;
      const bufferData = Buffer.isBuffer(pdfBuffer)
        ? pdfBuffer
        : Buffer.from(pdfBuffer);
      const uploadResult = await storageService.uploadFile(
        fileName,
        bufferData,
        "application/pdf",
      );

      if (uploadResult.success) {
        pdfPath = fileName;
        await prisma.invoice.update({
          where: { id: invoiceDetails.id },
          data: { pdfUrl: pdfPath },
        });
      }
    } catch (pdfError) {
      console.error(
        "PDF generation failed (non-fatal):",
        pdfError instanceof Error ? pdfError.message : pdfError,
      );
    }

    if (invoice.patient?.phone && pdfPath) {
      try {
        const presignedUrl = await storageService.generatePresignedUrl(
          pdfPath,
          parseInt(process.env.URL_EXPIRY_SECONDS || "604800", 10),
        );
        await sendSMSNotification("INVOICE_NOTIFICATION", {
          phone: invoice.patient.phone,
          patientName: invoice.patient.patientName,
          therapistName: "",
          amount: totalAmount,
          link: presignedUrl,
        });
      } catch {
        // SMS failure is non-fatal
      }
    }

    // Re-fetch with full includes so client state has invoiceItems + transactions
    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        patient: {
          select: { id: true, patientName: true, email: true, phone: true },
        },
        invoiceItems: {
          select: {
            invoiceId: true,
            serviceId: true,
            serviceName: true,
            priceAtPurchase: true,
            quantity: true,
            description: true,
            category: true,
          },
        },
        transactions: { orderBy: { transactionDate: "desc" } },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: { invoice: fullInvoice, selectedServices, pdfPath },
        message: "Invoice created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to create invoice" },
      { status: 500 },
    );
  }
}

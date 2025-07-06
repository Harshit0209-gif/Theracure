import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createInvoiceSchema = z.object({
  id: z.string().optional(),
  patientId: z.string().min(1, "Patient ID is required"),
  patientName: z.string().min(1, "Patient name is required"),
  date: z.string().datetime(),
  totalAmount: z.number().min(0, "Total amount must be positive"),
  amountPaid: z.number().min(0, "Amount paid must be positive").default(0),
  status: z.enum(["DUE", "PAID", "CANCELLED"]).default("DUE"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  createdBy: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "date";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: "insensitive" } },
        { id: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
      ];
    }

    // Fetch invoices with pagination
    const [invoices, totalCount] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              patientName: true,
              email: true,
              phone: true,
            },
          },
          invoiceItems: {
            select: {
              invoiceId: true,
              serviceId: true,
              serviceName: true,
              priceAtPurchase: true,
              quantity: true,
            },
          },
        },

        orderBy: {
          [sortBy]: sortOrder as "asc" | "desc",
        },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

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
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoices",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Creating invoice with data:", body);
    const {
      patientInfo,
      invoiceDetails,
      selectedServices,
      paymentDetails,
      createdBy,
    } = body;

    // Check if patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: patientInfo.id },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: "Patient not found",
        },
        { status: 404 }
      );
    }

    // Determine status based on payment
    const status = paymentDetails?.balance > 0 ? "DUE" : "PAID";

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        id: invoiceDetails.invoiceId || undefined, // Use provided ID or let Prisma generate one
        patientId: patientInfo?.id,
        status,
        totalAmount: paymentDetails?.totalAmount,
        subTotal: paymentDetails?.subTotal || 0,
        offer: paymentDetails?.offer || 0,
        amountPaid: paymentDetails?.amountPaid || 0,
        paymentMethod: paymentDetails?.paymentMethod || "CASH",
        createdBy: createdBy,
        notes: invoiceDetails.notes || "",
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    //insert data for each selected service into invoice_service table
    if (selectedServices && selectedServices.length > 0) {
      await prisma.invoiceItem.createMany({
        data: selectedServices.map((service: any) => ({
          invoiceId: invoiceDetails.invoiceId,
          serviceId: service.id,
          serviceName: service.name,
          priceAtPurchase: service.price,
          quantity: service.quantity || 1,
        })),
      });
    }

    return NextResponse.json(
      {
        success: true,
        data: { invoice, selectedServices },
        message: "Invoice created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create invoice",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

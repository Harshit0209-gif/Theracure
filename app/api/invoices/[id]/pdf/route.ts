import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";
import {
  InvoicePayload,
  PaymentStatus,
  InvoiceStatus as AppInvoiceStatus,
  TransactionStatus as AppTransactionStatus,
} from "@/types/invoice";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch invoice with all necessary data
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            email: true,
            phone: true,
            address: true,
            age: true,
            gender: true,
          },
        },
        invoiceItems: true,
        transactions: {
          orderBy: {
            transactionDate: "desc",
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Calculate totals from transactions
    const totalPaid = invoice.transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const balance = invoice.totalAmount - totalPaid;

    // Prepare payload for PDF generation
    const invoicePayload: InvoicePayload = {
      patientInfo: {
        id: invoice.patient?.id || "N/A",
        patientName: invoice.patient?.patientName || "Deleted Patient",
        email: invoice.patient?.email || "",
        phone: invoice.patient?.phone || "",
        address: invoice.patient?.address || "",
        age: invoice.patient?.age || 0,
        gender: invoice.patient?.gender || "",
        createdBy: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      invoiceDetails: {
        id: invoice.id,
        patientId: invoice.patientId || id,
        patient: {
          id: invoice.patient?.id || "N/A",
          patientName: invoice.patient?.patientName || "Deleted Patient",
          age: invoice.patient?.age || 0,
          gender: invoice.patient?.gender || "",
          createdBy: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        date: invoice.date instanceof Date ? invoice.date.toISOString() : invoice.date,
        status: invoice.status as unknown as AppInvoiceStatus,
        subTotal: invoice.subTotal,
        totalAmount: invoice.totalAmount,
        amountPaid: totalPaid,
        offer: invoice.offer || 0,
        createdAt: invoice.createdAt instanceof Date ? invoice.createdAt.toISOString() : String(invoice.createdAt),
        updatedAt: invoice.updatedAt instanceof Date ? invoice.updatedAt.toISOString() : String(invoice.updatedAt),
        createdBy: "",
        invoiceItems: invoice.invoiceItems.map((item) => ({
          invoiceId: item.invoiceId,
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          priceAtPurchase: item.priceAtPurchase,
          quantity: item.quantity,
          description: item.description || "",
          category: item.category || "",
        })),
        transactions: invoice.transactions.map((t) => ({
          id: t.id,
          invoiceId: t.invoiceId,
          amount: t.amount,
          paymentMethod: t.paymentMethod,
          transactionDate: t.transactionDate instanceof Date ? t.transactionDate.toISOString() : String(t.transactionDate),
          status: t.status as unknown as AppTransactionStatus,
          createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : String(t.createdAt),
          updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt),
        })),
      },
      paymentDetails: {
        subTotal: invoice.subTotal,
        totalAmount: invoice.totalAmount,
        amountPaid: totalPaid,
        balance: balance,
        offer: invoice.offer || 0,
        discount: (invoice.subTotal * (invoice.offer || 0)) / 100,
        status: balance <= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
      },
      selectedServices: [],
      type: "invoice",
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoicePayload);

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${invoice.patient?.patientName || "deleted"}-${id}.pdf"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Error generating invoice PDF:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate PDF",
      },
      { status: 500 }
    );
  }
}

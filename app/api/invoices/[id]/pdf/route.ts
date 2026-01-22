import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";
import { InvoicePayload, PaymentStatus } from "@/types/invoice";

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
      },
      invoiceDetails: {
        id: invoice.id,
        date: invoice.date,
        status: invoice.status,
        subTotal: invoice.subTotal,
        totalAmount: invoice.totalAmount,
        amountPaid: totalPaid,
        offer: invoice.offer || 0,
        invoiceItems: invoice.invoiceItems,
        transactions: invoice.transactions,
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
    };

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoicePayload);

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
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
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

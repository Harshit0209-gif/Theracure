import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus, TransactionStatus } from "@prisma/client";
import generateInvoicePDF from "@/lib/utils/InvoicePDFGenerator";
import { storageService } from "@/lib/services/storage-factory";
import { sendSMSNotification } from "@/config/smsConfig";
import {
  InvoicePayload,
  PaymentStatus,
  InvoiceStatus as AppInvoiceStatus,
  TransactionStatus as AppTransactionStatus,
} from "@/types/invoice";

const settlePaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: invoiceId } = await params;
    const body = await request.json();

    // Validate the request body
    const validatedData = settlePaymentSchema.parse(body);

    // Fetch the invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        transactions: {
          where: {
            status: TransactionStatus.SUCCESS,
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 },
      );
    }

    // Check if invoice is already paid
    if (invoice.status === InvoiceStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice is already fully paid",
        },
        { status: 400 },
      );
    }

    // Calculate total amount already paid from successful transactions
    // Round each transaction before summing to prevent floating point precision drift
    const totalPaid = parseFloat(
      invoice.transactions
        .reduce((sum, transaction) => {
          const transactionAmount = parseFloat(transaction.amount.toFixed(2));
          return sum + transactionAmount;
        }, 0)
        .toFixed(2),
    );

    // Calculate remaining balance with 2 decimal precision
    const remainingBalance = parseFloat(
      (invoice.totalAmount - totalPaid).toFixed(2),
    );

    // Validate payment amount
    if (validatedData.amount > remainingBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (₹${validatedData.amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`,
        },
        { status: 400 },
      );
    }

    // Round the payment amount to 2 decimal places before storing
    const roundedAmount = parseFloat(validatedData.amount.toFixed(2));

    // Create new transaction
    const transaction = await prisma.transaction.create({
      data: {
        invoiceId: invoiceId,
        amount: roundedAmount,
        paymentMethod: validatedData.paymentMethod,
        transactionDate:
          validatedData.transactionDate || new Date().toISOString(),
        status: TransactionStatus.SUCCESS,
      },
    });

    // Calculate new total paid amount with 2 decimal precision
    const newTotalPaid = parseFloat((totalPaid + roundedAmount).toFixed(2));
    const newBalance = parseFloat(
      (invoice.totalAmount - newTotalPaid).toFixed(2),
    );

    // Update invoice status and amountPaid
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newTotalPaid,
        status: newBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.DUE,
        paymentMethod: validatedData.paymentMethod,
        notes: validatedData.notes
          ? `${invoice.notes || ""}\n${validatedData.notes}`.trim()
          : invoice.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
            email: true,
            phone: true,
            address: true,
          },
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
        transactions: {
          orderBy: {
            transactionDate: "desc",
          },
        },
      },
    });

    Promise.resolve().then(async () => {
      try {
        const invoicePayload: InvoicePayload = {
          patientInfo: {
            id: updatedInvoice.patient?.id || "",
            patientName: updatedInvoice.patient?.patientName || "",
            email: updatedInvoice.patient?.email || "",
            phone: updatedInvoice.patient?.phone || "",
            address: updatedInvoice.patient?.address || "",
            age: 0,
            gender: "",
            createdBy: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          invoiceDetails: {
            id: updatedInvoice.id,
            patientId: invoiceId,
            patient: {
              id: updatedInvoice.patient?.id || "",
              patientName: updatedInvoice.patient?.patientName || "",
              age: 0,
              gender: "",
              createdBy: "",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            date:
              updatedInvoice.date instanceof Date
                ? updatedInvoice.date.toISOString()
                : updatedInvoice.date,
            status: updatedInvoice.status as unknown as AppInvoiceStatus,
            subTotal: updatedInvoice.subTotal,
            totalAmount: updatedInvoice.totalAmount,
            amountPaid: newTotalPaid,
            offer: updatedInvoice.offer || 0,
            createdAt:
              updatedInvoice.createdAt instanceof Date
                ? updatedInvoice.createdAt.toISOString()
                : String(updatedInvoice.createdAt),
            updatedAt:
              updatedInvoice.updatedAt instanceof Date
                ? updatedInvoice.updatedAt.toISOString()
                : String(updatedInvoice.updatedAt),
            createdBy: "",
            invoiceItems: updatedInvoice.invoiceItems.map((item) => ({
              invoiceId: item.invoiceId,
              serviceId: item.serviceId,
              serviceName: item.serviceName,
              priceAtPurchase: item.priceAtPurchase,
              quantity: item.quantity,
              description: item.description || "",
              category: item.category || "",
            })),
            transactions: updatedInvoice.transactions.map((t) => ({
              id: t.id,
              invoiceId: t.invoiceId,
              amount: t.amount,
              paymentMethod: t.paymentMethod,
              transactionDate:
                t.transactionDate instanceof Date
                  ? t.transactionDate.toISOString()
                  : String(t.transactionDate),
              status: t.status as unknown as AppTransactionStatus,
              createdAt:
                t.createdAt instanceof Date
                  ? t.createdAt.toISOString()
                  : String(t.createdAt),
              updatedAt:
                t.updatedAt instanceof Date
                  ? t.updatedAt.toISOString()
                  : String(t.updatedAt),
            })),
          },
          paymentDetails: {
            subTotal: updatedInvoice.subTotal,
            totalAmount: updatedInvoice.totalAmount,
            amountPaid: newTotalPaid,
            balance: newBalance,
            offer: updatedInvoice.offer || 0,
            discount:
              (updatedInvoice.subTotal * (updatedInvoice.offer || 0)) / 100,
            status:
              newBalance <= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
          },
          selectedServices: [],
          type: "invoice",
        };

        const pdfBuffer = await generateInvoicePDF(invoicePayload);
        const filePath = `invoices/${invoiceId}.pdf`;

        const uploadResult = await storageService.uploadFile(
          filePath,
          Buffer.from(pdfBuffer),
          "application/pdf",
        );
        if (!uploadResult.success) {
          console.error(
            "Failed to upload settled invoice PDF:",
            uploadResult.error,
          );
          return;
        }

        await prisma.invoice.update({
          where: { id: invoiceId },
          data: { pdfUrl: filePath },
        });

        if (newBalance <= 0 && updatedInvoice.patient?.phone) {
          const SEVEN_DAYS = 7 * 24 * 60 * 60;
          const downloadUrl = await storageService.generatePresignedUrl(
            filePath,
            SEVEN_DAYS,
          );

          await sendSMSNotification("INVOICE_NOTIFICATION", {
            phone: updatedInvoice.patient.phone,
            patientName: updatedInvoice.patient.patientName,
            therapistName: "",
            amount: updatedInvoice.totalAmount,
            link: downloadUrl,
          });
        }
      } catch (pdfOrSmsError) {
        // Non-fatal — log and continue
        console.error(
          "Failed to regenerate invoice PDF or send SMS:",
          pdfOrSmsError,
        );
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          invoice: updatedInvoice,
          transaction: transaction,
          remainingBalance: newBalance,
          totalPaid: newTotalPaid,
        },
        message:
          newBalance <= 0
            ? "Invoice fully settled"
            : `Payment recorded. Remaining balance: ₹${newBalance.toFixed(2)}`,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error settling invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to settle invoice",
      },
      { status: 500 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus, TransactionStatus } from "@prisma/client";

const settlePaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = params.id;
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
        { status: 404 }
      );
    }

    // Check if invoice is already paid
    if (invoice.status === InvoiceStatus.PAID) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice is already fully paid",
        },
        { status: 400 }
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
        .toFixed(2)
    );

    // Calculate remaining balance with 2 decimal precision
    const remainingBalance = parseFloat(
      (invoice.totalAmount - totalPaid).toFixed(2)
    );

    // Validate payment amount
    if (validatedData.amount > remainingBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Payment amount (₹${validatedData.amount}) exceeds remaining balance (₹${remainingBalance.toFixed(2)})`,
        },
        { status: 400 }
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
        transactionDate: validatedData.transactionDate || new Date().toISOString(),
        status: TransactionStatus.SUCCESS,
      },
    });

    // Calculate new total paid amount with 2 decimal precision
    const newTotalPaid = parseFloat((totalPaid + roundedAmount).toFixed(2));
    const newBalance = parseFloat((invoice.totalAmount - newTotalPaid).toFixed(2));

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
      { status: 200 }
    );
  } catch (error) {
    console.error("Error settling invoice:", error);

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
        error: "Failed to settle invoice",
      },
      { status: 500 }
    );
  }
}

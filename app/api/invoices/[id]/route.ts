import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus, TransactionStatus } from "@prisma/client";
import { PaymentStatus } from "@/types/invoice";

const updateInvoiceSchema = z.object({
  date: z.string().datetime(),
  totalAmount: z.number().min(0),
  alreadyPaid: z.number().min(0),
  due: z.number().min(0),
  paymentAmount: z.number().min(0),
  status: z
    .enum([PaymentStatus.PAID, PaymentStatus.PENDING, PaymentStatus.FAILED])
    .optional(),
  paymentMethod: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const validatedData = updateInvoiceSchema.parse(body);
    const { totalAmount, paymentAmount, alreadyPaid, date, paymentMethod } =
      validatedData;

    const existingInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }
    const newTotalAmount = totalAmount ?? existingInvoice.totalAmount;
    const newAmountPaid =
      (existingInvoice.amountPaid || 0) + (paymentAmount || 0);

    const newStatus =
      newAmountPaid >= newTotalAmount ? InvoiceStatus.PAID : InvoiceStatus.DUE;

    const updateData: any = {
      totalAmount: newTotalAmount,
      amountPaid: newAmountPaid,
      status: newStatus,
      date: date ? new Date(date) : existingInvoice.date,
      paymentMethod: paymentMethod || existingInvoice.paymentMethod,
    };

    const updatedInvoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, patientName: true, email: true, phone: true },
        },
      },
    });

    if (updateData.amountPaid > 0) {
      await prisma.transaction.create({
        data: {
          invoiceId: id,
          amount: paymentAmount,
          paymentMethod: paymentMethod || "Cash",
          transactionDate: new Date().toISOString(),
          status: TransactionStatus.SUCCESS,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: "Invoice updated successfully",
    });
  } catch (error) {
    console.error("Error updating invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update invoice",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if invoice exists
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        {
          success: false,
          error: "Invoice not found",
        },
        { status: 404 }
      );
    }

    // Soft delete or hard delete based on your preference
    // For hard delete:
    await prisma.invoice.delete({
      where: { id },
    });

    // For soft delete (if you have a deletedAt field):
    // await prisma.invoice.update({
    //   where: { id },
    //   data: { deletedAt: new Date() }
    // })

    return NextResponse.json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete invoice",
      },
      { status: 500 }
    );
  }
}

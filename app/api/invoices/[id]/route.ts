import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { InvoiceStatus, TransactionStatus } from "@prisma/client";
import { PaymentStatus } from "@/types/invoice";
import { getSession } from "@/lib/auth/session-provider";
import { recordAuditLog } from "@/lib/services/audit-log-service";

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
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const session = await getSession(request);

    const validatedData = updateInvoiceSchema.parse(body);
    const { totalAmount, paymentAmount, alreadyPaid, date, paymentMethod } =
      validatedData;

    // Draft-only editable fields (Module 3): line-item quantities, discount
    // (offer), and remarks (notes). Read directly off the raw body since the
    // existing updateInvoiceSchema above is unrelated to these and every
    // other caller (e.g. PaymentDialog) never sends them.
    const invoiceItemsUpdate = Array.isArray(body.invoiceItems)
      ? (body.invoiceItems as { id: string; quantity: number }[])
      : undefined;
    const offerUpdate = typeof body.offer === "number" ? body.offer : undefined;
    const notesUpdate = typeof body.notes === "string" ? body.notes : undefined;
    const isDraftEdit =
      !!invoiceItemsUpdate || offerUpdate !== undefined || notesUpdate !== undefined;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { invoiceItems: true },
    });
    if (!existingInvoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    if (isDraftEdit && existingInvoice.status !== InvoiceStatus.DRAFT) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Line items, discount, and remarks can only be edited while the invoice is in Draft status",
        },
        { status: 400 },
      );
    }

    let newSubTotal = existingInvoice.subTotal;
    let newTotalAmount = totalAmount ?? existingInvoice.totalAmount;

    if (isDraftEdit) {
      const quantityMap = new Map(
        (invoiceItemsUpdate ?? []).map((item) => [item.id, item.quantity]),
      );
      newSubTotal = parseFloat(
        existingInvoice.invoiceItems
          .reduce((sum, item) => {
            const quantity = quantityMap.get(item.id) ?? item.quantity;
            return sum + item.priceAtPurchase * quantity;
          }, 0)
          .toFixed(2),
      );
      const effectiveOffer = offerUpdate ?? existingInvoice.offer ?? 0;
      const discount = parseFloat(
        ((newSubTotal * effectiveOffer) / 100).toFixed(2),
      );
      newTotalAmount = parseFloat((newSubTotal - discount).toFixed(2));
    }

    const newAmountPaid =
      (existingInvoice.amountPaid || 0) + (paymentAmount || 0);

    // Draft invoices only leave Draft via the explicit finalize endpoint —
    // editing items or recording a payment while still Draft must not
    // silently promote it out of Draft.
    const newStatus =
      existingInvoice.status === InvoiceStatus.DRAFT
        ? InvoiceStatus.DRAFT
        : newAmountPaid >= newTotalAmount
          ? InvoiceStatus.PAID
          : InvoiceStatus.DUE;

    const updateData: any = {
      totalAmount: newTotalAmount,
      subTotal: newSubTotal,
      amountPaid: newAmountPaid,
      status: newStatus,
      date: date ? new Date(date) : existingInvoice.date,
      paymentMethod: paymentMethod || existingInvoice.paymentMethod,
    };
    if (offerUpdate !== undefined) updateData.offer = offerUpdate;
    if (notesUpdate !== undefined) updateData.notes = notesUpdate;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      if (invoiceItemsUpdate) {
        for (const item of invoiceItemsUpdate) {
          await tx.invoiceItem.update({
            where: { id: item.id },
            data: { quantity: item.quantity },
          });
        }
      }

      const updated = await tx.invoice.update({
        where: { id },
        data: updateData,
        include: {
          patient: {
            select: { id: true, patientName: true, email: true, phone: true },
          },
          invoiceItems: true,
        },
      });

      if (updateData.amountPaid > 0 && paymentAmount > 0) {
        await tx.transaction.create({
          data: {
            invoiceId: id,
            amount: paymentAmount,
            paymentMethod: paymentMethod || "Cash",
            transactionDate: new Date().toISOString(),
            status: TransactionStatus.SUCCESS,
          },
        });
      }

      if (isDraftEdit) {
        await recordAuditLog(tx, {
          entityType: "Invoice",
          entityId: id,
          action: "INVOICE_UPDATED",
          userId: session?.user?.id,
          notes: "Draft invoice items/discount/remarks updated",
        });
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: "Invoice updated successfully",
    });
  } catch (error) {
    console.error("Error updating invoice:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update invoice",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
        { status: 404 },
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
      { status: 500 },
    );
  }
}

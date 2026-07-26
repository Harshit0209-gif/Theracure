import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@prisma/client";
import { getSession } from "@/lib/auth/session-provider";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(request);

    const invoice = await prisma.invoice.findUnique({ where: { id } });
    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 },
      );
    }

    if (invoice.status !== InvoiceStatus.DRAFT) {
      return NextResponse.json(
        { success: false, error: "Only draft invoices can be finalized" },
        { status: 400 },
      );
    }

    const newStatus =
      invoice.amountPaid >= invoice.totalAmount
        ? InvoiceStatus.PAID
        : InvoiceStatus.DUE;

    const updatedInvoice = await prisma.$transaction(async (tx) => {
      const updated = await tx.invoice.update({
        where: { id },
        data: { status: newStatus },
        include: {
          patient: {
            select: { id: true, patientName: true, email: true, phone: true },
          },
          invoiceItems: true,
        },
      });

      await recordAuditLog(tx, {
        entityType: "Invoice",
        entityId: id,
        action: "INVOICE_FINALIZED",
        userId: session?.user?.id,
        notes: `Finalized as ${newStatus}`,
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedInvoice,
      message: "Invoice finalized successfully",
    });
  } catch (error) {
    console.error("Error finalizing invoice:", error);
    return NextResponse.json(
      { success: false, error: "Failed to finalize invoice" },
      { status: 500 },
    );
  }
}

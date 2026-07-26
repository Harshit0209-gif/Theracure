import { prisma } from "@/lib/prisma";
import { AppointmentStatus, InvoiceStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sendSMSNotification } from "@/config/smsConfig";
import { getSession } from "@/lib/auth/session-provider";
import { recordAuditLog } from "@/lib/services/audit-log-service";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;
    const session = await getSession(req);

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (existing?.invoice) {
      const invoice = existing.invoice;
      const hasRecordedPayment =
        invoice.status === InvoiceStatus.PAID ||
        (invoice.status === InvoiceStatus.DUE && invoice.amountPaid > 0);
      if (hasRecordedPayment) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Cannot cancel: the linked invoice has recorded payments. Resolve/refund the invoice manually before cancelling this appointment.",
          },
          { status: 400 },
        );
      }
    }

    const appointment = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: { id },
        data: {
          notes: reason,
          status: AppointmentStatus.CANCELLED,
        },
        include: {
          patient: {
            select: {
              patientName: true,
              phone: true,
            },
          },
          therapist: {
            select: {
              name: true,
            },
          },
        },
      });

      if (
        existing?.invoice &&
        existing.invoice.status !== InvoiceStatus.CANCELLED
      ) {
        await tx.invoice.update({
          where: { id: existing.invoice.id },
          data: { status: InvoiceStatus.CANCELLED },
        });
        await recordAuditLog(tx, {
          entityType: "Invoice",
          entityId: existing.invoice.id,
          action: "INVOICE_CANCELLED",
          userId: session?.user?.id,
          notes: `Cancelled via cancellation of appointment ${id}`,
        });
      }

      return updated;
    });

    // Send SMS notification
    if (appointment.patient?.phone) {
      try {
        await sendSMSNotification("APPOINTMENT_CANCELLED", {
          phone: appointment.patient.phone,
          patientName: appointment.patient.patientName,
          therapistName: appointment.therapist.name,
          date: appointment.appointmentStartTime,
          startTime: appointment.appointmentStartTime,
        });
      } catch (smsError) {
        console.error("Failed to queue SMS:", smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Appointment cancel successfully",
    });
  } catch (error) {
    console.error("Error cancel appointment:", error);
    return NextResponse.json(
      { success: false, error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}

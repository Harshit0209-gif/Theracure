import { prisma } from "@/lib/prisma";
import { AppointmentStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { sendSMSNotification } from "@/config/smsConfig";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { reason } = body;

    const appointment = await prisma.appointment.update({
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

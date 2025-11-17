import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { sendSMSNotification } from "@/config/smsConfig";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch appointment with all necessary details
    const appointment = await prisma.appointment.findUnique({
      where: { id },
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
        service: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (!appointment.patient?.phone) {
      return NextResponse.json(
        { success: false, error: "Patient phone number not found" },
        { status: 400 }
      );
    }

    // Send SMS based on appointment status
    let smsType: "APPOINTMENT_CONFIRMATION" | "APPOINTMENT_CANCELLED" | "APPOINTMENT_RESCHEDULED";

    switch (appointment.status) {
      case "CONFIRMED":
        smsType = "APPOINTMENT_CONFIRMATION";
        await sendSMSNotification(smsType, {
          phone: appointment.patient.phone,
          patientName: appointment.patient.patientName,
          therapistName: appointment.therapist.name,
          serviceName: appointment.service?.name || "Therapy",
          date: appointment.assignedDate,
          startTime: appointment.appointmentStartTime,
          endTime: appointment.appointmentEndTime,
        });
        break;

      case "CANCELLED":
        smsType = "APPOINTMENT_CANCELLED";
        await sendSMSNotification(smsType, {
          phone: appointment.patient.phone,
          patientName: appointment.patient.patientName,
          therapistName: appointment.therapist.name,
          date: appointment.assignedDate,
        });
        break;

      case "RESCHEDULED":
        smsType = "APPOINTMENT_RESCHEDULED";
        await sendSMSNotification(smsType, {
          phone: appointment.patient.phone,
          patientName: appointment.patient.patientName,
          therapistName: appointment.therapist.name,
          date: appointment.assignedDate,
          startTime: appointment.appointmentStartTime,
        });
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Cannot send reminder for this appointment status" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Reminder SMS sent successfully for ${appointment.status} appointment`,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reminder SMS" },
      { status: 500 }
    );
  }
}

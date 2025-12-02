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

    // Only send feedback SMS for completed appointments
    if (appointment.status !== "COMPLETED") {
      return NextResponse.json(
        {
          success: false,
          error: "Feedback SMS can only be sent for completed appointments",
        },
        { status: 400 }
      );
    }

    // Generate feedback link (you can customize this URL)
    const feedbackLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/feedback/${appointment.id}`;

    // Send feedback SMS
    await sendSMSNotification("FEEDBACK_REQUEST", {
      phone: appointment.patient.phone,
      patientName: appointment.patient.patientName,
      therapistName: "", // Not needed for feedback
      link: feedbackLink,
    });

    return NextResponse.json({
      success: true,
      message: "Feedback SMS sent successfully",
    });
  } catch (error) {
    console.error("Error sending feedback SMS:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send feedback SMS" },
      { status: 500 }
    );
  }
}

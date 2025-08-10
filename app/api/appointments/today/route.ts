import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const appointments = await prisma.appointment.findMany({
      where: {
        assignedDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        patient: { select: { patientName: true } },
        therapist: { select: { name: true } },
      },
      orderBy: { appointmentStartTime: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: appointments.map((apt) => ({
        id: apt.id,
        patientName: apt.patient.patientName,
        therapistName: apt.therapist.name,
        time: apt.appointmentStartTime.toISOString(),
        status: apt.status,
      })),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

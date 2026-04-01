import { prisma, withRetry } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-provider";
import { toISTDateKey } from "@/lib/utils/utils";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { role, id: userId } = session.user;

    const todayIST = toISTDateKey(new Date());
    const todayDate = new Date(`${todayIST}T00:00:00.000Z`);

    const appointments = await withRetry(() =>
      prisma.appointment.findMany({
        where: {
          assignedDate: todayDate,
          ...(role === "THERAPIST" && { therapistId: userId }),
        },
        include: {
          patient: { select: { patientName: true } },
          therapist: { select: { name: true } },
        },
        orderBy: { appointmentStartTime: "asc" },
      }),
    );

    return NextResponse.json({
      success: true,
      data: appointments.map((apt) => ({
        id: apt.id,
        patientName: apt.patient?.patientName || "Unknown Patient",
        therapistName: apt.therapist.name,
        time: apt.appointmentStartTime.toISOString(),
        status: apt.status,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch today's appointments" },
      { status: 500 },
    );
  }
}

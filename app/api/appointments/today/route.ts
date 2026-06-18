import { prisma, withRetry } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session-provider";

function getTodayISTWindow(): { start: Date; end: Date } {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowIST = nowUTC + IST_OFFSET_MS;
  const startOfDayIST = nowIST - (nowIST % (24 * 60 * 60 * 1000));
  const start = new Date(startOfDayIST - IST_OFFSET_MS);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

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
    const { start, end } = getTodayISTWindow();

    const appointments = await withRetry(() =>
      prisma.appointment.findMany({
        where: {
          // Use appointmentStartTime (always current) not assignedDate (stale on reschedule)
          appointmentStartTime: { gte: start, lt: end },
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
        patientName: apt.patient?.patientName ?? "Unknown Patient",
        therapistName: apt.therapist?.name ?? "Unassigned",
        time: apt.appointmentStartTime.toISOString(),
        status: apt.status,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch today's appointments" },
      { status: 500 },
    );
  }
}

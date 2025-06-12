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

    // Today's sessions
    const todaySessions = await prisma.therapySession.groupBy({
      by: ["completed"],
      _count: true,
      where: {
        sessionDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    const formattedSessions = todaySessions.map((item) => ({
      status: item.completed ? "Completed" : "Pending",
      count: item._count,
    }));

    // Today's consultations
    const todayConsultations = await prisma.consultation.groupBy({
      by: ["status"],
      _count: { status: true },
      where: {
        consultationDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Therapist status
    const therapistStatus = await prisma.therapist.groupBy({
      by: ["status"],
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        todaySessions: {
          total: formattedSessions.reduce((sum, item) => sum + item.count, 0),
          ...Object.fromEntries(
            formattedSessions.map((item) => [
              item.status.toLowerCase(),
              item.count,
            ])
          ),
        },
        todayConsultations: {
          total: todayConsultations.reduce(
            (sum, item) => sum + item._count.status,
            0
          ),
          ...Object.fromEntries(
            todayConsultations.map((item) => [
              item.status.toLowerCase(),
              item._count.status,
            ])
          ),
        },
        therapistStatus: {
          total: therapistStatus.reduce((sum, item) => sum + item._count, 0),
          ...Object.fromEntries(
            therapistStatus.map((item) => [
              item.status?.toLowerCase() ?? "unknown",
              item._count,
            ])
          ),
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log("Stats API Route called with therapist ID:", id);
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(startOfDay.getDate() + 1);

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get assigned patients count
    const assignedPatients = await prisma.therapistAssignment.count({
      where: {
        therapistId: id,
        status: {
          in: ["confirmed"],
        },
      },
    });

    // Get today's appointments
    const todayAppointments = await prisma.therapistAssignment.count({
      where: {
        therapistId: id,
        status: {
          in: ["confirmed"],
        },
        appointmentStartTime: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    // Get completed sessions count
    const completedSessions = await prisma.therapySession.count({
      where: {
        therapistId: id,
        completed: true,
      },
    });

    // Get pending sessions
    const pendingSessions = await prisma.therapySession.count({
      where: {
        therapistId: id,
        completed: false,
      },
    });

    // Get this month's sessions
    const thisMonthSessions = await prisma.therapySession.count({
      where: {
        id,
        sessionDate: {
          gte: startOfMonth,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        assignedPatients,
        todayAppointments,
        completedSessions,
        pendingSessions,
        thisMonthSessions,
      },
    });
  } catch (error) {
    console.error("Error fetching therapist stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch therapist statistics" },
      { status: 500 }
    );
  }
}

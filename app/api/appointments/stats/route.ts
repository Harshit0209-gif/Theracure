import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const date =
      url.searchParams.get("date") || new Date().toISOString().split("T")[0];
    const therapistId = url.searchParams.get("therapistId");

    const today = new Date(date);
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const where = {
      appointmentStartTime: {
        gte: startOfDay,
        lte: endOfDay,
      },
      ...(therapistId && { therapistId }),
    };

    const [
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
    ] = await Promise.all([
      prisma.appointment.count({ where }),
      prisma.appointment.count({ where: { ...where, status: "confirmed" } }),
      prisma.appointment.count({ where: { ...where, status: "completed" } }),
      prisma.appointment.count({ where: { ...where, status: "cancelled" } }),
    ]);

    return NextResponse.json({
      success: true,
      stats: {
        total: totalAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        date,
      },
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getTodayISTWindow(): { startOfDay: Date; endOfDay: Date } {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const nowUTC = Date.now();
  const nowIST = nowUTC + IST_OFFSET_MS;
  const startIST = nowIST - (nowIST % (24 * 60 * 60 * 1000));
  const startOfDay = new Date(startIST - IST_OFFSET_MS);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return { startOfDay, endOfDay };
}

export async function GET() {
  try {
    const { startOfDay, endOfDay } = getTodayISTWindow();

    const nowISTDate = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    const daysSinceMonday = (nowISTDate.getUTCDay() + 6) % 7;
    const startOfWeek = new Date(
      startOfDay.getTime() - daysSinceMonday * 24 * 60 * 60 * 1000,
    );

    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfLastWeek = new Date(
      startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000,
    );
    const endOfLastWeek = new Date(startOfWeek);

    const istYear = nowISTDate.getUTCFullYear();
    const istMonth = nowISTDate.getUTCMonth();
    const startOfMonth = new Date(
      Date.UTC(istYear, istMonth, 1) - 5.5 * 60 * 60 * 1000,
    );
    const startOfLastMonth = new Date(
      Date.UTC(istYear, istMonth - 1, 1) - 5.5 * 60 * 60 * 1000,
    );
    const endOfLastMonth = new Date(
      Date.UTC(istYear, istMonth, 1) - 5.5 * 60 * 60 * 1000,
    );

    const todayWhere = {
      appointmentStartTime: { gte: startOfDay, lt: endOfDay },
    };

    const [
      totalPatientsThisMonth,
      totalPatientsLastMonth,
      todayConsultations,
      weekConsultations,
      lastWeekConsultations,
      todayCompleted,
      todayPending,
      pendingInvoices,
    ] = await Promise.all([
      prisma.patient.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.patient.count({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),

      prisma.appointment.count({
        where: {
          ...todayWhere,
          status: { notIn: ["CANCELLED"] },
          service: { category: "CONSULTATION" },
        },
      }),

      prisma.appointment.count({
        where: {
          appointmentStartTime: { gte: startOfWeek, lt: endOfWeek },
          status: { notIn: ["CANCELLED"] },
          service: { category: "CONSULTATION" },
        },
      }),

      prisma.appointment.count({
        where: {
          appointmentStartTime: { gte: startOfLastWeek, lt: endOfLastWeek },
          status: { notIn: ["CANCELLED"] },
          service: { category: "CONSULTATION" },
        },
      }),

      prisma.appointment.count({
        where: { ...todayWhere, status: "COMPLETED" },
      }),

      prisma.appointment.count({
        where: {
          ...todayWhere,
          status: { in: ["CONFIRMED", "RESCHEDULED"] },
        },
      }),

      // Pending invoices — only unpaid (DUE)
      prisma.invoice.aggregate({
        where: { status: "DUE" },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
    ]);

    // Calculate growth percentage
    const growthPercentage =
      totalPatientsLastMonth > 0
        ? ((totalPatientsThisMonth - totalPatientsLastMonth) /
            totalPatientsLastMonth) *
          100
        : totalPatientsThisMonth > 0
          ? 100
          : 0;

    const stats = {
      totalPatients: {
        count: await prisma.patient.count(),
        growthPercentage,
        isGrowthPositive: growthPercentage >= 0,
      },
      todayConsultations: {
        total: todayConsultations,
        thisWeek: weekConsultations,
        lastWeek: lastWeekConsultations,
        weekGrowthPercentage:
          lastWeekConsultations > 0
            ? ((weekConsultations - lastWeekConsultations) /
                lastWeekConsultations) *
              100
            : weekConsultations > 0
              ? 100
              : 0,
        isWeekGrowthPositive: weekConsultations >= lastWeekConsultations,
      },
      todaySessions: {
        total: todayCompleted,
        pending: todayPending,
      },
      pendingPayments: {
        amount: pendingInvoices._sum.totalAmount || 0,
        invoiceCount: pendingInvoices._count.id || 0,
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching receptionist stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch receptionist statistics" },
      { status: 500 },
    );
  }
}

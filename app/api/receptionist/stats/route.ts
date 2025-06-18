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

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Parallel queries for better performance
    const [
      totalPatientsThisMonth,
      totalPatientsLastMonth,
      todayConsultations,
      weekConsultations,
      todaySessions,
      pendingSessions,
      pendingInvoices,
    ] = await Promise.all([
      // Total patients this month
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Total patients last month
      prisma.patient.count({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth,
          },
        },
      }),

      // Today's consultations
      prisma.therapistAssignment.count({
        where: {
          appointmentStartTime: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // This week's consultations
      prisma.therapistAssignment.count({
        where: {
          appointmentStartTime: {
            gte: startOfWeek,
          },
        },
      }),

      // Today's therapy sessions
      prisma.therapySession.count({
        where: {
          sessionDate: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),

      // Pending sessions
      prisma.therapySession.count({
        where: {
          completed: false,
        },
      }),

      // Pending invoices
      prisma.invoice.aggregate({
        where: {
          status: {
            in: ["DUE", "PAID"],
          },
        },
        _sum: {
          totalAmount: true,
        },
        _count: {
          id: true,
        },
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
        newThisWeek: weekConsultations - todayConsultations,
      },
      todaySessions: {
        total: todaySessions,
        pending: pendingSessions,
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
      { status: 500 }
    );
  }
}

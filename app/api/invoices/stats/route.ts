import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Default to current month if no dates provided
    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentPeriodStart = startDate
      ? new Date(startDate)
      : defaultStartDate;
    const currentPeriodEnd = endDate ? new Date(endDate) : defaultEndDate;

    // Calculate previous period (same duration)
    const periodDuration =
      currentPeriodEnd.getTime() - currentPeriodStart.getTime();
    const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
    const previousPeriodStart = new Date(
      previousPeriodEnd.getTime() - periodDuration
    );

    const currentPeriodFilter = {
      date: {
        gte: currentPeriodStart,
        lte: currentPeriodEnd,
      },
    };

    const previousPeriodFilter = {
      date: {
        gte: previousPeriodStart,
        lte: previousPeriodEnd,
      },
    };

    const [
      // Current period stats
      totalInvoices,
      paidInvoices,
      dueInvoices,
      cancelledInvoices,
      currentRevenue,
      currentPaid,

      // Previous period stats for comparison
      previousRevenue,
      previousPaid,
    ] = await Promise.all([
      // Current period counts
      prisma.invoice.count({ where: currentPeriodFilter }),

      prisma.invoice.count({
        where: { ...currentPeriodFilter, status: "PAID" },
      }),

      prisma.invoice.count({
        where: { ...currentPeriodFilter, status: "DUE" },
      }),

      prisma.invoice.count({
        where: { ...currentPeriodFilter, status: "CANCELLED" },
      }),

      // Current period revenue aggregation
      prisma.invoice.aggregate({
        where: currentPeriodFilter,
        _sum: {
          totalAmount: true,
          amountPaid: true,
        },
      }),

      prisma.invoice.aggregate({
        where: { ...currentPeriodFilter, status: "PAID" },
        _sum: {
          totalAmount: true,
          amountPaid: true,
        },
      }),

      // Previous period for growth calculation
      prisma.invoice.aggregate({
        where: previousPeriodFilter,
        _sum: {
          totalAmount: true,
          amountPaid: true,
        },
      }),

      prisma.invoice.aggregate({
        where: { ...previousPeriodFilter, status: "PAID" },
        _sum: {
          totalAmount: true,
          amountPaid: true,
        },
      }),
    ]);

    // Calculate current period values
    const thisMonthRevenue = currentRevenue._sum.totalAmount || 0;
    const lastMonthRevenue = previousRevenue._sum.totalAmount || 0;
    const thisMonthPaid = currentRevenue._sum.amountPaid || 0;
    const lastMonthPaid = previousRevenue._sum.amountPaid || 0;

    // Calculate outstanding amount (total amount - amount paid)
    const thisMonthDue = thisMonthRevenue - thisMonthPaid;
    const lastMonthDue = lastMonthRevenue - lastMonthPaid;

    // Calculate growth percentages
    const revenueGrowthPercentage =
      lastMonthRevenue > 0
        ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    const paidGrowthPercentage =
      lastMonthPaid > 0
        ? ((thisMonthPaid - lastMonthPaid) / lastMonthPaid) * 100
        : 0;

    const dueGrowthPercentage =
      lastMonthDue > 0
        ? ((thisMonthDue - lastMonthDue) / lastMonthDue) * 100
        : 0;

    // Calculate collection rate
    const collectionRate =
      thisMonthRevenue > 0 ? (thisMonthPaid / thisMonthRevenue) * 100 : 0;

    // Calculate partially paid invoices (invoices with some payment but not fully paid)
    const partiallyPaidCount = await prisma.invoice.count({
      where: {
        ...currentPeriodFilter,
        status: "DUE",
        amountPaid: { gt: 0 },
      },
    });

    const stats = {
      // Invoice counts
      totalInvoices,
      paidInvoices,
      dueInvoices,
      cancelledInvoices,
      partiallyPaidInvoices: partiallyPaidCount,

      // Financial summary
      totalRevenue: thisMonthRevenue,
      totalPaid: thisMonthPaid,
      totalDue: thisMonthDue,
      collectionRate: parseFloat(collectionRate.toFixed(2)),

      // Revenue growth analysis
      revenue: {
        thisMonth: thisMonthRevenue,
        lastMonth: lastMonthRevenue,
        growthPercentage: parseFloat(revenueGrowthPercentage.toFixed(2)),
        isGrowthPositive: revenueGrowthPercentage >= 0,
      },

      // Payment collection analysis
      paidRevenue: {
        thisMonth: thisMonthPaid,
        lastMonth: lastMonthPaid,
        growthPercentage: parseFloat(paidGrowthPercentage.toFixed(2)),
        isGrowthPositive: paidGrowthPercentage >= 0,
      },

      // Outstanding amount analysis
      dueAmount: {
        thisMonth: thisMonthDue,
        lastMonth: lastMonthDue,
        growthPercentage: parseFloat(dueGrowthPercentage.toFixed(2)),
        isGrowthPositive: dueGrowthPercentage >= 0, // Note: positive growth in due amount is actually bad
      },

      // Additional metrics
      averageInvoiceValue:
        totalInvoices > 0 ? thisMonthRevenue / totalInvoices : 0,
      paymentCompletionRate:
        totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,

      // Period information
      period: {
        start: currentPeriodStart.toISOString().split("T")[0],
        end: currentPeriodEnd.toISOString().split("T")[0],
        previousStart: previousPeriodStart.toISOString().split("T")[0],
        previousEnd: previousPeriodEnd.toISOString().split("T")[0],
      },
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch invoice statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

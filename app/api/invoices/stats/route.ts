import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const now = new Date();
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentPeriodStart = startDate ? new Date(startDate) : defaultStartDate;
    const currentPeriodEnd = endDate ? new Date(endDate) : defaultEndDate;

    const periodDuration = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
    const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
    const previousPeriodStart = new Date(previousPeriodEnd.getTime() - periodDuration);

    const currentPeriodFilter = { date: { gte: currentPeriodStart, lte: currentPeriodEnd } };
    const previousPeriodFilter = { date: { gte: previousPeriodStart, lte: previousPeriodEnd } };

    const [currentGroups, , currentAggregate, previousAggregate, partiallyPaidCount] =
      await withRetry(() => Promise.all([
        prisma.invoice.groupBy({
          by: ["status"],
          where: currentPeriodFilter,
          _count: { _all: true },
        }),
        prisma.invoice.groupBy({
          by: ["status"],
          where: previousPeriodFilter,
          _count: { _all: true },
        }),
        prisma.invoice.aggregate({
          where: currentPeriodFilter,
          _sum: { totalAmount: true, amountPaid: true },
        }),
        prisma.invoice.aggregate({
          where: previousPeriodFilter,
          _sum: { totalAmount: true, amountPaid: true },
        }),
        prisma.invoice.count({
          where: { ...currentPeriodFilter, status: "DUE", amountPaid: { gt: 0 } },
        }),
      ]));

    const countByStatus = (groups: typeof currentGroups, status: string) =>
      groups.find((g) => g.status === status)?._count._all ?? 0;

    const totalInvoices = currentGroups.reduce((s, g) => s + g._count._all, 0);
    const paidInvoices = countByStatus(currentGroups, "PAID");
    const dueInvoices = countByStatus(currentGroups, "DUE");
    const cancelledInvoices = countByStatus(currentGroups, "CANCELLED");

    const thisMonthRevenue = currentAggregate._sum.totalAmount || 0;
    const lastMonthRevenue = previousAggregate._sum.totalAmount || 0;
    const thisMonthPaid = currentAggregate._sum.amountPaid || 0;
    const lastMonthPaid = previousAggregate._sum.amountPaid || 0;
    const thisMonthDue = thisMonthRevenue - thisMonthPaid;
    const lastMonthDue = lastMonthRevenue - lastMonthPaid;

    const revenueGrowthPercentage = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
    const paidGrowthPercentage = lastMonthPaid > 0 ? ((thisMonthPaid - lastMonthPaid) / lastMonthPaid) * 100 : 0;
    const dueGrowthPercentage = lastMonthDue > 0 ? ((thisMonthDue - lastMonthDue) / lastMonthDue) * 100 : 0;
    const collectionRate = thisMonthRevenue > 0 ? (thisMonthPaid / thisMonthRevenue) * 100 : 0;

    const stats = {
      totalInvoices, paidInvoices, dueInvoices, cancelledInvoices,
      partiallyPaidInvoices: partiallyPaidCount,
      totalRevenue: thisMonthRevenue,
      totalPaid: thisMonthPaid,
      totalDue: thisMonthDue,
      collectionRate: parseFloat(collectionRate.toFixed(2)),
      revenue: {
        thisMonth: thisMonthRevenue, lastMonth: lastMonthRevenue,
        growthPercentage: parseFloat(revenueGrowthPercentage.toFixed(2)),
        isGrowthPositive: revenueGrowthPercentage >= 0,
      },
      paidRevenue: {
        thisMonth: thisMonthPaid, lastMonth: lastMonthPaid,
        growthPercentage: parseFloat(paidGrowthPercentage.toFixed(2)),
        isGrowthPositive: paidGrowthPercentage >= 0,
      },
      dueAmount: {
        thisMonth: thisMonthDue, lastMonth: lastMonthDue,
        growthPercentage: parseFloat(dueGrowthPercentage.toFixed(2)),
        isGrowthPositive: dueGrowthPercentage >= 0,
      },
      averageInvoiceValue: totalInvoices > 0 ? thisMonthRevenue / totalInvoices : 0,
      paymentCompletionRate: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
      period: {
        start: currentPeriodStart.toISOString().split("T")[0],
        end: currentPeriodEnd.toISOString().split("T")[0],
        previousStart: previousPeriodStart.toISOString().split("T")[0],
        previousEnd: previousPeriodEnd.toISOString().split("T")[0],
      },
    };

    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice statistics" },
      { status: 500 }
    );
  }
}

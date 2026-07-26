import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StatsPeriod {
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  previousPeriodStart: Date;
  previousPeriodEnd: Date;
}

export interface PeriodFilter {
  date: { gte: Date; lte: Date };
}

// ─── Period Helpers ──────────────────────────────────────────────────────────

export function buildPeriods(
  startDate: string | null,
  endDate: string | null
): StatsPeriod {
  const now = new Date();
  const currentPeriodStart = startDate
    ? new Date(startDate)
    : new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriodEnd = endDate
    ? new Date(endDate)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const periodDuration =
    currentPeriodEnd.getTime() - currentPeriodStart.getTime();
  const previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1);
  const previousPeriodStart = new Date(
    previousPeriodEnd.getTime() - periodDuration
  );

  return {
    currentPeriodStart,
    currentPeriodEnd,
    previousPeriodStart,
    previousPeriodEnd,
  };
}

export function buildDateFilter(start: Date, end: Date): PeriodFilter {
  return { date: { gte: start, lte: end } };
}

// ─── Calculation Helpers ─────────────────────────────────────────────────────

export function countByStatus(
  groups: { status: string; _count: { _all: number } }[],
  status: string
): number {
  return groups.find((g) => g.status === status)?._count._all ?? 0;
}

export function calcGrowth(
  current: number,
  previous: number
): { growthPercentage: number; isGrowthPositive: boolean } {
  const growthPercentage =
    previous > 0 ? ((current - previous) / previous) * 100 : 0;
  return {
    growthPercentage: parseFloat(growthPercentage.toFixed(2)),
    isGrowthPositive: growthPercentage >= 0,
  };
}

// ─── DB Queries ──────────────────────────────────────────────────────────────

export async function fetchStatsQueries(
  currentFilter: PeriodFilter,
  previousFilter: PeriodFilter
) {
  const [
    currentGroups,
    previousGroups,
    // Total Revenue: sum of totalAmount excluding CANCELLED
    currentRevenueAgg,
    previousRevenueAgg,
    // Total Paid: sum of amountPaid collected, excluding CANCELLED
    currentPaidAgg,
    previousPaidAgg,
    // Pending: remaining balance on DUE invoices only (totalAmount - amountPaid)
    currentDueAgg,
    previousDueAgg,
    partiallyPaidCount,
  ] = await Promise.all([
    prisma.invoice.groupBy({
      by: ["status"],
      where: { ...currentFilter, status: { not: "DRAFT" } },
      _count: { _all: true },
    }),
    prisma.invoice.groupBy({
      by: ["status"],
      where: { ...previousFilter, status: { not: "DRAFT" } },
      _count: { _all: true },
    }),
    prisma.invoice.aggregate({
      where: { ...currentFilter, status: { notIn: ["CANCELLED", "DRAFT"] } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { ...previousFilter, status: { notIn: ["CANCELLED", "DRAFT"] } },
      _sum: { totalAmount: true },
    }),
    prisma.invoice.aggregate({
      where: { ...currentFilter, status: { notIn: ["CANCELLED", "DRAFT"] } },
      _sum: { amountPaid: true },
    }),
    prisma.invoice.aggregate({
      where: { ...previousFilter, status: { notIn: ["CANCELLED", "DRAFT"] } },
      _sum: { amountPaid: true },
    }),
    prisma.invoice.aggregate({
      where: { ...currentFilter, status: "DUE" },
      _sum: { totalAmount: true, amountPaid: true },
    }),
    prisma.invoice.aggregate({
      where: { ...previousFilter, status: "DUE" },
      _sum: { totalAmount: true, amountPaid: true },
    }),
    prisma.invoice.count({
      where: { ...currentFilter, status: "DUE", amountPaid: { gt: 0 } },
    }),
  ]);

  return {
    currentGroups,
    previousGroups,
    currentRevenueAgg,
    previousRevenueAgg,
    currentPaidAgg,
    previousPaidAgg,
    currentDueAgg,
    previousDueAgg,
    partiallyPaidCount,
  };
}

// ─── Stats Builder ───────────────────────────────────────────────────────────

export function buildStats(
  period: StatsPeriod,
  data: Awaited<ReturnType<typeof fetchStatsQueries>>
) {
  const {
    currentGroups,
    currentRevenueAgg,
    previousRevenueAgg,
    currentPaidAgg,
    previousPaidAgg,
    currentDueAgg,
    previousDueAgg,
    partiallyPaidCount,
  } = data;

  // Counts
  const totalInvoices = currentGroups.reduce((s, g) => s + g._count._all, 0);
  const paidInvoices = countByStatus(currentGroups, "PAID");
  const dueInvoices = countByStatus(currentGroups, "DUE");
  const cancelledInvoices = countByStatus(currentGroups, "CANCELLED");

  // Amounts
  const thisMonthRevenue = currentRevenueAgg._sum.totalAmount ?? 0;
  const lastMonthRevenue = previousRevenueAgg._sum.totalAmount ?? 0;

  const thisMonthPaid = currentPaidAgg._sum.amountPaid ?? 0;
  const lastMonthPaid = previousPaidAgg._sum.amountPaid ?? 0;

  // Pending = remaining unpaid on DUE invoices only
  const thisMonthDue =
    (currentDueAgg._sum.totalAmount ?? 0) -
    (currentDueAgg._sum.amountPaid ?? 0);
  const lastMonthDue =
    (previousDueAgg._sum.totalAmount ?? 0) -
    (previousDueAgg._sum.amountPaid ?? 0);

  const collectionRate =
    thisMonthRevenue > 0
      ? parseFloat(((thisMonthPaid / thisMonthRevenue) * 100).toFixed(2))
      : 0;

  const { currentPeriodStart, currentPeriodEnd, previousPeriodStart, previousPeriodEnd } =
    period;

  return {
    totalInvoices,
    paidInvoices,
    dueInvoices,
    cancelledInvoices,
    partiallyPaidInvoices: partiallyPaidCount,
    totalRevenue: thisMonthRevenue,
    totalPaid: thisMonthPaid,
    totalDue: thisMonthDue,
    collectionRate,
    revenue: {
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      ...calcGrowth(thisMonthRevenue, lastMonthRevenue),
    },
    paidRevenue: {
      thisMonth: thisMonthPaid,
      lastMonth: lastMonthPaid,
      ...calcGrowth(thisMonthPaid, lastMonthPaid),
    },
    dueAmount: {
      thisMonth: thisMonthDue,
      lastMonth: lastMonthDue,
      ...calcGrowth(thisMonthDue, lastMonthDue),
    },
    averageInvoiceValue:
      totalInvoices > 0 ? thisMonthRevenue / totalInvoices : 0,
    paymentCompletionRate:
      totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    period: {
      start: currentPeriodStart.toISOString().split("T")[0],
      end: currentPeriodEnd.toISOString().split("T")[0],
      previousStart: previousPeriodStart.toISOString().split("T")[0],
      previousEnd: previousPeriodEnd.toISOString().split("T")[0],
    },
  };
}

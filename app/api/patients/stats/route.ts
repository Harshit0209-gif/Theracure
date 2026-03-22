import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function replaceBigIntWithNumber(obj: any): any {
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(replaceBigIntWithNumber);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceBigIntWithNumber(v)])
    );
  }
  return obj;
}

// Run a query with a timeout — returns fallback value if it times out
async function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  const timer = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );
  try {
    return await Promise.race([promise, timer]);
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfCurrentWeek = new Date(now);
    startOfCurrentWeek.setDate(now.getDate() - now.getDay());
    const endOfCurrentWeek = new Date(startOfCurrentWeek);
    endOfCurrentWeek.setDate(startOfCurrentWeek.getDate() + 6);
    const nextWeekStart = new Date(endOfCurrentWeek);
    nextWeekStart.setDate(endOfCurrentWeek.getDate() + 1);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // ── Fast queries (simple counts, no relation joins) ──────────────────
    const [
      totalPatients,
      patientsThisMonth,
      patientsLastMonth,
      recentRegistrations,
      genderDistribution,
      ageGroups,
      monthlyTrend,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.patient.count({ where: { createdAt: { gte: startOfCurrentMonth } } }),
      prisma.patient.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
      prisma.patient.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.patient.groupBy({ by: ["gender"], _count: { gender: true } }),
      // Use groupBy for age distribution instead of fetching all rows
      prisma.$queryRaw<{ bucket: string; count: bigint }[]>`
        SELECT
          CASE
            WHEN age < 18  THEN 'Under 18'
            WHEN age <= 30 THEN '18-30'
            WHEN age <= 50 THEN '31-50'
            WHEN age <= 70 THEN '51-70'
            ELSE 'Over 70'
          END AS bucket,
          COUNT(*) AS count
        FROM patients
        GROUP BY bucket
      `,
      prisma.$queryRaw<{ month: string; count: bigint }[]>`
        SELECT TO_CHAR(created_at, 'YYYY-MM') as month, COUNT(*) as count
        FROM patients WHERE created_at >= ${sixMonthsAgo}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM') ORDER BY month ASC
      `,
    ]);

    // ── Slow queries (relation joins) — run with individual timeouts ─────
    const [activePatientsCount, pendingFollowUps, patientsWithInvoices] = await Promise.all([
      withTimeout(
        prisma.patient.count({ where: { therapySessions: { some: { sessionDate: { gte: thirtyDaysAgo } } } } }),
        8000, 0
      ),
      withTimeout(
        prisma.patient.count({ where: { therapySessions: { some: { sessionDate: { gte: nextWeekStart, lte: nextWeekEnd } } } } }),
        8000, 0
      ),
      withTimeout(
        prisma.patient.count({ where: { invoices: { some: {} } } }),
        8000, 0
      ),
    ]);

    const growthPercentage =
      patientsLastMonth > 0
        ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100
        : patientsThisMonth > 0 ? 100 : 0;

    // Build age group map from raw query result
    const ageGroupMap: Record<string, number> = { "Under 18": 0, "18-30": 0, "31-50": 0, "51-70": 0, "Over 70": 0 };
    (ageGroups as { bucket: string; count: bigint }[]).forEach((row) => {
      if (row.bucket in ageGroupMap) ageGroupMap[row.bucket] = Number(row.count);
    });

    const stats = {
      totalPatients: {
        count: totalPatients,
        thisMonth: patientsThisMonth,
        lastMonth: patientsLastMonth,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        isGrowthPositive: growthPercentage >= 0,
      },
      activePatients: { count: activePatientsCount, description: "Currently in treatment (last 30 days)" },
      pendingFollowUps: {
        count: pendingFollowUps,
        period: "Scheduled for next week",
        nextWeekStart: nextWeekStart.toISOString().split("T")[0],
        nextWeekEnd: nextWeekEnd.toISOString().split("T")[0],
      },
      recentActivity: { recentRegistrations, description: "New patients in last 7 days" },
      analytics: {
        genderDistribution: genderDistribution.map((item) => ({
          gender: item.gender,
          count: item._count.gender,
          percentage: totalPatients > 0 ? Math.round((item._count.gender / totalPatients) * 100) : 0,
        })),
        ageGroups: ageGroupMap,
        revenuePatients: {
          count: patientsWithInvoices,
          percentage: totalPatients > 0 ? Math.round((patientsWithInvoices / totalPatients) * 100) : 0,
        },
        monthlyTrend,
      },
      meta: {
        generatedAt: now.toISOString(),
        dateRanges: {
          currentMonth: { start: startOfCurrentMonth.toISOString().split("T")[0], end: now.toISOString().split("T")[0] },
          lastMonth: { start: startOfLastMonth.toISOString().split("T")[0], end: endOfLastMonth.toISOString().split("T")[0] },
          nextWeek: { start: nextWeekStart.toISOString().split("T")[0], end: nextWeekEnd.toISOString().split("T")[0] },
        },
      },
    };

    return NextResponse.json({
      success: true,
      data: replaceBigIntWithNumber(stats),
      message: "Patient statistics fetched successfully",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch patient statistics" },
      { status: 500 }
    );
  }
}

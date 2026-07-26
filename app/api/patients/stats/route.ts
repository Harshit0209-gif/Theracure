import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function replaceBigIntWithNumber(obj: any): any {
  if (typeof obj === "bigint") return Number(obj);
  if (Array.isArray(obj)) return obj.map(replaceBigIntWithNumber);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [k, replaceBigIntWithNumber(v)]),
    );
  }
  return obj;
}

async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  fallback: T,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  try {
    const result = await Promise.race([promise, timeout]);
    clearTimeout(timer!);
    return result;
  } catch {
    clearTimeout(timer!);
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const nextWeekStart = new Date(now);
    nextWeekStart.setDate(now.getDate() - now.getDay() + 7);
    nextWeekStart.setHours(0, 0, 0, 0);
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    nextWeekEnd.setHours(23, 59, 59, 999);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // ── All queries as raw SQL — fast, no ORM join overhead ──────────────
    const [
      basicStats,
      genderDistribution,
      ageGroups,
      monthlyTrend,
      activePatientsCount,
      pendingFollowUps,
      patientsWithInvoices,
    ] = await Promise.all([
      // Basic counts in one query
      withTimeout(
        prisma.$queryRaw<
          {
            total: bigint;
            this_month: bigint;
            last_month: bigint;
            last_7_days: bigint;
          }[]
        >`
          SELECT
            COUNT(*) AS total,
            COUNT(*) FILTER (WHERE created_at >= ${startOfCurrentMonth}) AS this_month,
            COUNT(*) FILTER (WHERE created_at >= ${startOfLastMonth} AND created_at <= ${endOfLastMonth}) AS last_month,
            COUNT(*) FILTER (WHERE created_at >= ${sevenDaysAgo}) AS last_7_days
          FROM patients
        `,
        10000,
        [
          {
            total: BigInt(0),
            this_month: BigInt(0),
            last_month: BigInt(0),
            last_7_days: BigInt(0),
          },
        ],
      ),

      // Gender distribution
      withTimeout(
        prisma.$queryRaw<{ gender: string; count: bigint }[]>`
          SELECT gender, COUNT(*) AS count FROM patients GROUP BY gender
        `,
        10000,
        [] as { gender: string; count: bigint }[],
      ),

      // Age groups
      withTimeout(
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
        10000,
        [] as { bucket: string; count: bigint }[],
      ),

      // Monthly trend
      withTimeout(
        prisma.$queryRaw<{ month: string; count: bigint }[]>`
          SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*) AS count
          FROM patients
          WHERE created_at >= ${sixMonthsAgo}
          GROUP BY month
          ORDER BY month ASC
        `,
        10000,
        [] as { month: string; count: bigint }[],
      ),

      // Active patients (had a therapy session in last 30 days) — raw SQL avoids ORM join
      withTimeout(
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT patient_id) AS count
          FROM therapy_sessions
          WHERE session_date >= ${thirtyDaysAgo}
        `,
        8000,
        [{ count: BigInt(0) }],
      ),

      // Pending follow-ups (session scheduled next week)
      withTimeout(
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT patient_id) AS count
          FROM therapy_sessions
          WHERE session_date >= ${nextWeekStart} AND session_date <= ${nextWeekEnd}
        `,
        8000,
        [{ count: BigInt(0) }],
      ),

      // Patients with at least one invoice (excluding unreviewed drafts)
      withTimeout(
        prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(DISTINCT patient_id) AS count FROM invoices WHERE status != 'DRAFT'
        `,
        8000,
        [{ count: BigInt(0) }],
      ),
    ]);

    const basic = basicStats[0];
    const totalPatients = Number(basic.total);
    const patientsThisMonth = Number(basic.this_month);
    const patientsLastMonth = Number(basic.last_month);
    const recentRegistrations = Number(basic.last_7_days);

    const growthPercentage =
      patientsLastMonth > 0
        ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100
        : patientsThisMonth > 0
          ? 100
          : 0;

    const ageGroupMap: Record<string, number> = {
      "Under 18": 0,
      "18-30": 0,
      "31-50": 0,
      "51-70": 0,
      "Over 70": 0,
    };
    ageGroups.forEach((row) => {
      if (row.bucket in ageGroupMap)
        ageGroupMap[row.bucket] = Number(row.count);
    });

    const stats = {
      totalPatients: {
        count: totalPatients,
        thisMonth: patientsThisMonth,
        lastMonth: patientsLastMonth,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        isGrowthPositive: growthPercentage >= 0,
      },
      activePatients: {
        count: Number(activePatientsCount[0]?.count ?? 0),
        description: "Currently in treatment (last 30 days)",
      },
      pendingFollowUps: {
        count: Number(pendingFollowUps[0]?.count ?? 0),
        period: "Scheduled for next week",
        nextWeekStart: nextWeekStart.toISOString().split("T")[0],
        nextWeekEnd: nextWeekEnd.toISOString().split("T")[0],
      },
      recentActivity: {
        recentRegistrations,
        description: "New patients in last 7 days",
      },
      analytics: {
        genderDistribution: genderDistribution.map((item) => ({
          gender: item.gender,
          count: Number(item.count),
          percentage:
            totalPatients > 0
              ? Math.round((Number(item.count) / totalPatients) * 100)
              : 0,
        })),
        ageGroups: ageGroupMap,
        revenuePatients: {
          count: Number(patientsWithInvoices[0]?.count ?? 0),
          percentage:
            totalPatients > 0
              ? Math.round(
                  (Number(patientsWithInvoices[0]?.count ?? 0) /
                    totalPatients) *
                    100,
                )
              : 0,
        },
        monthlyTrend,
      },
      meta: {
        generatedAt: now.toISOString(),
        dateRanges: {
          currentMonth: {
            start: startOfCurrentMonth.toISOString().split("T")[0],
            end: now.toISOString().split("T")[0],
          },
          lastMonth: {
            start: startOfLastMonth.toISOString().split("T")[0],
            end: endOfLastMonth.toISOString().split("T")[0],
          },
          nextWeek: {
            start: nextWeekStart.toISOString().split("T")[0],
            end: nextWeekEnd.toISOString().split("T")[0],
          },
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
      { status: 500 },
    );
  }
}

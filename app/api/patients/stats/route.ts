import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Get current date and calculate date ranges
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

    // 1. TOTAL PATIENTS (All time)
    const totalPatients = await prisma.patient.count();

    // 2. PATIENTS REGISTERED THIS MONTH
    const patientsThisMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfCurrentMonth,
        },
      },
    });

    // 3. PATIENTS REGISTERED LAST MONTH
    const patientsLastMonth = await prisma.patient.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    // 4. CALCULATE GROWTH PERCENTAGE
    const growthPercentage =
      patientsLastMonth > 0
        ? ((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100
        : patientsThisMonth > 0
        ? 100
        : 0;

    // 5. ACTIVE PATIENTS (Patients with therapy sessions in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const activePatientsCount = await prisma.patient.count({
      where: {
        therapySessions: {
          some: {
            sessionDate: {
              gte: thirtyDaysAgo,
            },
          },
        },
      },
    });

    const pendingFollowUps = await prisma.patient.count({
      where: {
        therapySessions: {
          some: {
            sessionDate: {
              gte: nextWeekStart,
              lte: nextWeekEnd,
            },
          },
        },
      },
    });

    // 8. PATIENTS BY GENDER DISTRIBUTION
    const genderDistribution = await prisma.patient.groupBy({
      by: ["gender"],
      _count: {
        gender: true,
      },
    });

    // 9. PATIENTS BY AGE GROUPS
    const allPatientsWithAge = await prisma.patient.findMany({
      select: {
        age: true,
      },
    });

    const ageGroups = {
      "Under 18": 0,
      "18-30": 0,
      "31-50": 0,
      "51-70": 0,
      "Over 70": 0,
    };

    allPatientsWithAge.forEach((patient) => {
      if (patient.age < 18) ageGroups["Under 18"]++;
      else if (patient.age <= 30) ageGroups["18-30"]++;
      else if (patient.age <= 50) ageGroups["31-50"]++;
      else if (patient.age <= 70) ageGroups["51-70"]++;
      else ageGroups["Over 70"]++;
    });

    // 10. RECENT REGISTRATIONS (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentRegistrations = await prisma.patient.count({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // 12. PATIENTS WITH INVOICES (Revenue generating patients)
    const patientsWithInvoices = await prisma.patient.count({
      where: {
        invoices: {
          some: {},
        },
      },
    });

    // 14. MONTHLY REGISTRATION TREND (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const monthlyTrend = await prisma.$queryRaw`
        SELECT 
            TO_CHAR(created_at, 'YYYY-MM') as month,
            COUNT(*) as count
        FROM patients 
        WHERE created_at >= ${sixMonthsAgo}
        GROUP BY TO_CHAR(created_at, 'YYYY-MM')
        ORDER BY month ASC
        `;

    // Prepare the response
    const stats = {
      // Main Stats Cards
      totalPatients: {
        count: totalPatients,
        thisMonth: patientsThisMonth,
        lastMonth: patientsLastMonth,
        growthPercentage: Math.round(growthPercentage * 100) / 100,
        isGrowthPositive: growthPercentage >= 0,
      },

      activePatients: {
        count: activePatientsCount,
        description: "Currently in treatment (last 30 days)",
      },

      pendingFollowUps: {
        count: pendingFollowUps,
        period: "Scheduled for next week",
        nextWeekStart: nextWeekStart.toISOString().split("T")[0],
        nextWeekEnd: nextWeekEnd.toISOString().split("T")[0],
      },

      recentActivity: {
        recentRegistrations,
        description: "New patients in last 7 days",
      },

      // Detailed Analytics
      analytics: {
        genderDistribution: genderDistribution.map((item) => ({
          gender: item.gender,
          count: item._count.gender,
          percentage: Math.round((item._count.gender / totalPatients) * 100),
        })),

        ageGroups,

        profileCompleteness: {
          complete: totalPatients,
        },

        revenuePatients: {
          count: patientsWithInvoices,
          percentage:
            totalPatients > 0
              ? Math.round((patientsWithInvoices / totalPatients) * 100)
              : 0,
        },

        monthlyTrend,
      },

      // Meta information
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

    //helper function to format date
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

    return NextResponse.json({
      success: true,
      data: replaceBigIntWithNumber(stats),
      message: "Patient statistics fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching patient stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch patient statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

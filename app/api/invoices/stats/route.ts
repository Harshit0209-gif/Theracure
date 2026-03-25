import { NextRequest, NextResponse } from "next/server";
import { withRetry } from "@/lib/prisma";
import {
  buildPeriods,
  buildDateFilter,
  fetchStatsQueries,
  buildStats,
} from "@/lib/utils/invoiceStatsHelpers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const period = buildPeriods(
      searchParams.get("startDate"),
      searchParams.get("endDate")
    );

    const currentFilter = buildDateFilter(
      period.currentPeriodStart,
      period.currentPeriodEnd
    );
    const previousFilter = buildDateFilter(
      period.previousPeriodStart,
      period.previousPeriodEnd
    );

    const data = await withRetry(() =>
      fetchStatsQueries(currentFilter, previousFilter)
    );

    const stats = buildStats(period, data);

    return NextResponse.json({ success: true, data: stats });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch invoice statistics" },
      { status: 500 }
    );
  }
}

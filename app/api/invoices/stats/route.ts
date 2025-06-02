import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const dateFilter =
      startDate && endDate
        ? {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate),
            },
          }
        : {};

    const [
      totalInvoices,
      paidInvoices,
      dueInvoices,
      partiallyPaidInvoices,
      totalRevenue,
      totalPaid,
      totalDue,
    ] = await Promise.all([
      prisma.invoice.count({ where: dateFilter }),
      prisma.invoice.count({
        where: {
          ...dateFilter,
          status: "PAID",
        },
      }),
      prisma.invoice.count({
        where: {
          ...dateFilter,
          status: "DUE",
        },
      }),

      prisma.invoice.aggregate({
        where: {
          ...dateFilter,
          status: "PAID",
        },
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { totalAmount: true },
      }),
      prisma.invoice.aggregate({
        where: dateFilter,
        _sum: { totalAmount: true },
      }),
    ]);

    const stats = {
      totalInvoices,
      paidInvoices,
      totalPaid: totalPaid._sum.totalAmount || 0,
      partiallyPaidInvoices,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      totalPaid: totalPaid._sum.amountPaid || 0,
      totalDue:
        (totalDue._sum.totalAmount || 0) - (totalPaid._sum.amountPaid || 0),
      collectionRate: totalRevenue._sum.totalAmount
        ? (
            ((totalPaid._sum.amountPaid || 0) / totalRevenue._sum.totalAmount) *
            100
          ).toFixed(2)
        : 0,
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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session-provider";
import { UserRole } from "@prisma/client";
import { weeklyOffUpdateSchema } from "@/lib/validations/holiday";

export async function GET() {
  try {
    const configured = await prisma.weeklyOffConfiguration.findMany({
      orderBy: { weekDay: "asc" },
    });
    const byWeekDay = new Map(configured.map((c) => [c.weekDay, c]));

    const allDays = Array.from({ length: 7 }, (_, weekDay) => {
      const existing = byWeekDay.get(weekDay);
      return {
        weekDay,
        isActive: existing?.isActive ?? false,
      };
    });

    return NextResponse.json({ success: true, data: allDays });
  } catch (error) {
    console.error("Weekly-off GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch weekly-off configuration" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        {
          success: false,
          error: "Only admins can update the weekly-off configuration",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = weeklyOffUpdateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: result.error.issues },
        { status: 400 },
      );
    }
    const activeSet = new Set(result.data.activeWeekDays);

    await prisma.$transaction(
      Array.from({ length: 7 }, (_, weekDay) =>
        prisma.weeklyOffConfiguration.upsert({
          where: { weekDay },
          create: { weekDay, isActive: activeSet.has(weekDay) },
          update: { isActive: activeSet.has(weekDay) },
        }),
      ),
    );

    const updated = await prisma.weeklyOffConfiguration.findMany({
      orderBy: { weekDay: "asc" },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Weekly-off PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update weekly-off configuration" },
      { status: 500 },
    );
  }
}

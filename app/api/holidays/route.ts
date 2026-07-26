import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session-provider";
import { UserRole } from "@prisma/client";
import { createHolidaySchema } from "@/lib/validations/holiday";

export async function GET() {
  try {
    const holidays = await prisma.holiday.findMany({
      orderBy: { date: "asc" },
    });
    return NextResponse.json({ success: true, data: holidays });
  } catch (error) {
    console.error("Holidays GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch holidays" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
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
        { success: false, error: "Only admins can create holidays" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const result = createHolidaySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: result.error.issues },
        { status: 400 },
      );
    }
    const { date, name, description, isRecurring, isActive } = result.data;

    const duplicate = await prisma.holiday.findFirst({
      where: { date: new Date(date), name },
    });
    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          error: "A holiday with this name already exists on this date",
        },
        { status: 409 },
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        description: description || null,
        isRecurring: isRecurring ?? false,
        isActive: isActive ?? true,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: holiday }, { status: 201 });
  } catch (error) {
    console.error("Holiday POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create holiday" },
      { status: 500 },
    );
  }
}

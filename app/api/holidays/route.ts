import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session-provider";

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

    const body = await request.json();
    const { date, name, description, isRecurring } = body;

    if (!date || !name) {
      return NextResponse.json(
        { success: false, error: "Date and name are required" },
        { status: 400 },
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        description: description || null,
        isRecurring: isRecurring || false,
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

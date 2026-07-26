import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session-provider";
import { UserRole } from "@prisma/client";
import { updateHolidaySchema } from "@/lib/validations/holiday";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Only admins can edit holidays" },
        { status: 403 },
      );
    }

    const existing = await prisma.holiday.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Holiday not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const result = updateHolidaySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: result.error.issues },
        { status: 400 },
      );
    }
    const { date, name, description, isRecurring, isActive } = result.data;

    const newDate = date ? new Date(date) : existing.date;
    const newName = name ?? existing.name;

    const duplicate = await prisma.holiday.findFirst({
      where: { date: newDate, name: newName, id: { not: id } },
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

    const holiday = await prisma.holiday.update({
      where: { id },
      data: {
        date: newDate,
        name: newName,
        description: description === undefined ? existing.description : description,
        isRecurring: isRecurring ?? existing.isRecurring,
        isActive: isActive ?? existing.isActive,
      },
    });

    return NextResponse.json({ success: true, data: holiday });
  } catch (error) {
    console.error("Holiday PUT error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update holiday" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Only admins can delete holidays" },
        { status: 403 },
      );
    }

    await prisma.holiday.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Holiday deleted" });
  } catch (error) {
    console.error("Holiday DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete holiday" },
      { status: 500 },
    );
  }
}

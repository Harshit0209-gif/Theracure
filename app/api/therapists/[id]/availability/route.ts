import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDay } from "date-fns";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const startTime = searchParams.get("startTime");
    const endTime = searchParams.get("endTime");

    if (!date || !startTime || !endTime) {
      return NextResponse.json(
        {
          success: false,
          error: "Date, start time, and end time are required",
        },
        { status: 400 }
      );
    }

    // Convert date to weekday (0-6)
    const weekDay = getDay(new Date(date));

    // 1. Check if therapist has availability for this weekday
    const therapistAvailability = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId: id,
        weekDay,
        isAvailable: true,
        startTime: { lte: startTime },
        endTime: { gte: endTime },
      },
    });

    if (!therapistAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist is not available during this time slot",
        },
        { status: 400 }
      );
    }

    // 2. Check for existing appointments that overlap with the requested time
    const existingAppointments = await prisma.therapistAssignment.findMany({
      where: {
        therapistId: id,
        status: { in: ["confirmed"] },
        OR: [
          {
            AND: [
              {
                appointmentStartTime: { lte: new Date(`${date}T${startTime}`) },
              },
              { appointmentEndTime: { gt: new Date(`${date}T${startTime}`) } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: new Date(`${date}T${endTime}`) } },
              { appointmentEndTime: { gte: new Date(`${date}T${endTime}`) } },
            ],
          },
        ],
      },
    });

    if (existingAppointments.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Therapist already has an appointment during this time",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      isAvailable: true,
    });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check availability",
      },
      { status: 500 }
    );
  }
}

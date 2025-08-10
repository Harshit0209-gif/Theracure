import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDay } from "date-fns";
import { generateAvailablePeriods } from "@/lib/utils/AppointmentAvailableTimeSlotGenerator";
import { AppointmentStatus } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Date parameter is required",
        },
        { status: 400 }
      );
    }

    // Convert date to weekday (0-6)
    const weekDay = getDay(new Date(date));

    // 1. Get therapist's working schedule for this weekday
    const therapistSchedule = await prisma.therapistTimeSlot.findMany({
      where: {
        therapistId: id,
        weekDay,
        isAvailable: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (therapistSchedule.length === 0) {
      return NextResponse.json({
        success: true,
        availablePeriods: [],
        message: "Therapist is not available on this day",
      });
    }

    // 2. Get all existing appointments for the date
    const startOfDay = new Date(`${date}T00:00:00`);
    const endOfDay = new Date(`${date}T23:59:59`);

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        therapistId: id,
        status: { in: [AppointmentStatus.CONFIRMED] },
        appointmentStartTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: {
        appointmentStartTime: "asc",
      },
      select: {
        appointmentStartTime: true,
        appointmentEndTime: true,
        status: true,
      },
    });

    // 3. Generate available periods by splitting schedule around appointments
    const availablePeriods = generateAvailablePeriods(
      therapistSchedule,
      existingAppointments,
      date
    );

    console.log("Available Periods:", availablePeriods);

    return NextResponse.json({
      success: true,
      availablePeriods,
      therapistSchedule: therapistSchedule.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        weekDay: slot.weekDay,
      })),
      existingAppointments: existingAppointments.map((apt) => ({
        startTime: apt.appointmentStartTime.toTimeString().slice(0, 5),
        endTime: apt.appointmentEndTime.toTimeString().slice(0, 5),
        status: apt.status,
      })),
    });
  } catch (error) {
    console.error("Error getting availability:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get availability",
      },
      { status: 500 }
    );
  }
}

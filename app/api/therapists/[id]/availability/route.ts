import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateAvailablePeriods } from "@/lib/utils/AppointmentAvailableTimeSlotGenerator";
import { AppointmentStatus } from "@prisma/client";
import {
  formatTimeInClinicTimeZone,
  getClinicDayBounds,
  getClinicWeekDayFromDate,
} from "@/lib/utils/clinicDateTime";
import { isClinicClosed } from "@/lib/utils/appointmentDateValidation";

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

    const closed = await isClinicClosed(date);
    if (closed.closed) {
      return NextResponse.json({
        success: true,
        availablePeriods: [],
        closed: true,
        closedReason: closed.reason,
        message: closed.reason,
      });
    }

    const weekDay = getClinicWeekDayFromDate(date);

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
    const { startOfDay, endOfDay } = getClinicDayBounds(date);

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
      existingAppointments
    );

    return NextResponse.json({
      success: true,
      availablePeriods,
      therapistSchedule: therapistSchedule.map((slot) => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        weekDay: slot.weekDay,
      })),
      existingAppointments: existingAppointments.map((apt) => ({
        startTime: formatTimeInClinicTimeZone(apt.appointmentStartTime),
        endTime: formatTimeInClinicTimeZone(apt.appointmentEndTime),
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

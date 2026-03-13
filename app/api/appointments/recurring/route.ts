import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus, CubicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { appointments, recurringInfo } = await request.json();
    if (
      !appointments ||
      !Array.isArray(appointments) ||
      appointments.length === 0
    ) {
      return NextResponse.json(
        { error: "Invalid appointments data" },
        { status: 400 },
      );
    }

    const validationResults = await Promise.all(
      appointments.map(async (appointment, index) => {
        try {
          const isAvailable = await checkTherapistAvailability(
            appointment.therapistId,
            appointment.appointmentDate,
            appointment.appointmentStartTime,
            appointment.appointmentEndTime,
          );

          // NEW LOGIC: Check cubicle availability instead of therapist time conflicts
          const cubicleCheck = await checkCubicleAvailability(
            appointment.appointmentStartTime,
            appointment.appointmentEndTime,
          );

          return {
            index,
            appointment,
            isAvailable,
            hasAvailableCubicle: cubicleCheck.hasAvailableCubicle,
            assignedCubicle: cubicleCheck.assignedCubicle,
            availableCubicles: cubicleCheck.availableCubicles,
          };
        } catch (error) {
          return {
            index,
            appointment,
            isAvailable: false,
            hasAvailableCubicle: false,
            error: (error as Error).message,
          };
        }
      }),
    );

    // Check for conflicts - now based on cubicle availability, not therapist time
    const conflicts = validationResults.filter(
      (result) => !result.isAvailable || !result.hasAvailableCubicle,
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Some appointments have conflicts",
          conflicts: conflicts.map((conflict) => ({
            date: conflict.appointment.appointmentDate,
            reason: !conflict.isAvailable
              ? "Therapist not available"
              : "No cubicles available - all rooms are occupied",
          })),
        },
        { status: 409 },
      );
    }

    // Create all appointments in a transaction with extended timeout
    const createdAppointments = await prisma.$transaction(
      async (tx) => {
        const results = [];

        for (let i = 0; i < appointments.length; i++) {
          const appointment = appointments[i];
          const validationResult = validationResults[i];

          const createdAppointment = await tx.appointment.create({
            data: {
              patientId: appointment.patientId,
              therapistId: appointment.therapistId,
              serviceId: appointment.serviceId,
              assignedDate: new Date(appointment.appointmentDate).toISOString(),
              appointmentStartTime: appointment.appointmentStartTime,
              appointmentEndTime: appointment.appointmentEndTime,
              notes: appointment.notes || "",
              status: AppointmentStatus.CONFIRMED,
              createdById: appointment.createdById,
              isRecurring: true,
              recurringType: recurringInfo.type,
              recurringEndType: recurringInfo.endType,
              recurringEndDate: recurringInfo.endDate
                ? new Date(recurringInfo.endDate).toISOString()
                : null,
              recurringCount: recurringInfo.count,
              // Assign cubicle from validation result
              cubicleId: validationResult.assignedCubicle?.id || null,
            },
            include: {
              patient: {
                select: {
                  id: true,
                  patientName: true,
                  phone: true,
                },
              },
              therapist: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
              service: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  category: true,
                },
              },
              cubicle: {
                select: {
                  id: true,
                  name: true,
                  roomNumber: true,
                  location: true,
                },
              },
            },
          });

          results.push(createdAppointment);
        }

        return results;
      },
      {
        timeout: 30000,
      },
    );

    return NextResponse.json({
      success: true,
      appointments: createdAppointments,
      message: `Successfully created ${createdAppointments.length} recurring appointments`,
    });
  } catch (error) {
    console.error("Error creating recurring appointments:", error);
    return NextResponse.json(
      {
        error: "Failed to create recurring appointments",
      },
      { status: 500 },
    );
  }
}

// Helper function to check therapist availability
async function checkTherapistAvailability(
  therapistId: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  try {
    // Get therapist's schedule for the day of the week
    const dayOfWeek = new Date(date).getDay();

    const therapistSchedule = await prisma.therapistTimeSlot.findFirst({
      where: {
        therapistId,
        weekDay: dayOfWeek,
        isAvailable: true,
      },
    });

    if (!therapistSchedule) {
      return false; // Therapist doesn't work on this day
    }

    const startDateTime = new Date(startTime);
    const endDateTime = new Date(endTime);

    const requestedStartStr = startDateTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
    const requestedEndStr = endDateTime.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });

    const requestedStart = new Date(`2000-01-01T${requestedStartStr}:00`);
    const requestedEnd = new Date(`2000-01-01T${requestedEndStr}:00`);
    const scheduleStart = new Date(
      `2000-01-01T${therapistSchedule.startTime}:00`,
    );
    const scheduleEnd = new Date(`2000-01-01T${therapistSchedule.endTime}:00`);

    if (requestedStart < scheduleStart || requestedEnd > scheduleEnd) {
      return false;
    }

    const breaks = await prisma.therapistTimeSlot.findMany({
      where: {
        therapistId,
        weekDay: dayOfWeek,
        isAvailable: false,
      },
    });

    for (const breakPeriod of breaks) {
      const breakStart = new Date(`2000-01-01T${breakPeriod.startTime}:00`);
      const breakEnd = new Date(`2000-01-01T${breakPeriod.endTime}:00`);

      if (
        (requestedStart < breakEnd && requestedEnd > breakStart) ||
        (requestedStart >= breakStart && requestedStart < breakEnd) ||
        (requestedEnd > breakStart && requestedEnd <= breakEnd)
      ) {
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error checking therapist availability:", error);
    return false;
  }
}

// NEW: Helper function to check cubicle availability and auto-assign
async function checkCubicleAvailability(
  startTime: string,
  endTime: string,
) {
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);

    // Get all active cubicles
    const allCubicles = await prisma.cubicle.findMany({
      where: {
        status: CubicleStatus.ACTIVE,
      },
      orderBy: {
        name: "asc",
      },
    });

    if (allCubicles.length === 0) {
      return {
        hasAvailableCubicle: false,
        assignedCubicle: null,
        availableCubicles: [],
      };
    }

    // Find overlapping appointments
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: start } },
              { appointmentEndTime: { gt: start } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: end } },
              { appointmentEndTime: { gte: end } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: start } },
              { appointmentEndTime: { lte: end } },
            ],
          },
        ],
      },
      select: {
        cubicleId: true,
      },
    });

    // Get occupied cubicle IDs
    const occupiedCubicleIds = overlappingAppointments
      .map((apt) => apt.cubicleId)
      .filter((id): id is string => id !== null);

    // Find available cubicles
    const availableCubicles = allCubicles.filter(
      (cubicle) => !occupiedCubicleIds.includes(cubicle.id)
    );

    // Auto-assign first available cubicle
    const assignedCubicle = availableCubicles.length > 0 ? availableCubicles[0] : null;

    return {
      hasAvailableCubicle: availableCubicles.length > 0,
      assignedCubicle,
      availableCubicles,
    };
  } catch (error) {
    console.error("Error checking cubicle availability:", error);
    return {
      hasAvailableCubicle: false,
      assignedCubicle: null,
      availableCubicles: [],
    };
  }
}

import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus, CubicleStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateAppointmentDate } from "@/lib/utils/appointmentDateValidation";

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

    const normalizedAppointments = appointments.map((appointment, index) => ({
      ...appointment,
      appointmentDate: normalizeDateOnly(appointment.appointmentDate),
      appointmentStartTime: new Date(appointment.appointmentStartTime).toISOString(),
      appointmentEndTime: new Date(appointment.appointmentEndTime).toISOString(),
      __index: index,
    }));

    const duplicateOccurrences = findDuplicateRecurringOccurrences(normalizedAppointments);
    if (duplicateOccurrences.length > 0) {
      return NextResponse.json(
        {
          error: "Recurring schedule contains duplicate appointment occurrences",
          conflicts: duplicateOccurrences,
        },
        { status: 409 },
      );
    }

    const validationResults = await Promise.all(
      normalizedAppointments.map(async (appointment, index) => {
        try {
          const dateError = await validateAppointmentDate(appointment.appointmentDate);
          if (dateError) {
            return {
              index,
              appointment,
              isAvailable: false,
              hasAvailableCubicle: false,
              error: dateError,
            };
          }

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

    const batchConflicts = findInternalBatchConflicts(normalizedAppointments);
    if (batchConflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Recurring schedule contains overlapping appointment entries",
          conflicts: batchConflicts,
        },
        { status: 409 },
      );
    }

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
            reason: conflict.error || (!conflict.isAvailable
              ? "Therapist not available"
              : "No cubicles available - all rooms are occupied"),
          })),
        },
        { status: 409 },
      );
    }

    // Create all appointments in a transaction with extended timeout
    const createdAppointments = await prisma.$transaction(
      async (tx) => {
        const results = [];
        const reservedCubicles = new Map<string, Set<string>>();

        for (let i = 0; i < normalizedAppointments.length; i++) {
          const appointment = normalizedAppointments[i];
          const validationResult = validationResults[i];

          const assignedCubicle = selectAvailableCubicleForBatch(
            validationResult.availableCubicles ?? [],
            appointment.appointmentStartTime,
            appointment.appointmentEndTime,
            reservedCubicles,
          );

          if (!assignedCubicle) {
            throw new Error(
              `No cubicles available for ${appointment.appointmentDate} after batching recurring appointments`,
            );
          }

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
              cubicleId: assignedCubicle.id,
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

function normalizeDateOnly(date: string) {
  return new Date(date).toISOString().split("T")[0];
}

function occurrenceKey(appointment: {
  patientId: string;
  therapistId: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
}) {
  return [
    appointment.patientId,
    appointment.therapistId,
    appointment.appointmentStartTime,
    appointment.appointmentEndTime,
  ].join("|");
}

function findDuplicateRecurringOccurrences(
  appointments: Array<{
    patientId: string;
    therapistId: string;
    appointmentDate: string;
    appointmentStartTime: string;
    appointmentEndTime: string;
  }>,
) {
  const seen = new Set<string>();

  return appointments.reduce<
    Array<{ date: string; reason: string }>
  >((duplicates, appointment) => {
    const key = occurrenceKey(appointment);
    if (seen.has(key)) {
      duplicates.push({
        date: appointment.appointmentDate,
        reason: "Duplicate recurring occurrence generated for the same patient and time slot",
      });
      return duplicates;
    }

    seen.add(key);
    return duplicates;
  }, []);
}

function hasTimeOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
) {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();

  return aStart < bEnd && bStart < aEnd;
}

function findInternalBatchConflicts(
  appointments: Array<{
    patientId: string;
    therapistId: string;
    appointmentDate: string;
    appointmentStartTime: string;
    appointmentEndTime: string;
  }>,
) {
  const conflicts: Array<{ date: string; reason: string }> = [];

  for (let i = 0; i < appointments.length; i++) {
    for (let j = i + 1; j < appointments.length; j++) {
      const first = appointments[i];
      const second = appointments[j];

      if (first.therapistId !== second.therapistId) {
        continue;
      }

      if (
        hasTimeOverlap(
          first.appointmentStartTime,
          first.appointmentEndTime,
          second.appointmentStartTime,
          second.appointmentEndTime,
        )
      ) {
        conflicts.push({
          date: second.appointmentDate,
          reason: "Recurring schedule overlaps with another generated appointment for the same therapist",
        });
      }
    }
  }

  return conflicts;
}

function slotKey(startTime: string, endTime: string) {
  return `${startTime}|${endTime}`;
}

function selectAvailableCubicleForBatch(
  availableCubicles: Array<{ id: string }>,
  startTime: string,
  endTime: string,
  reservedCubicles: Map<string, Set<string>>,
) {
  const key = slotKey(startTime, endTime);
  const reservedForSlot = reservedCubicles.get(key) ?? new Set<string>();

  const cubicle = availableCubicles.find(
    (candidate) => !reservedForSlot.has(candidate.id),
  );

  if (!cubicle) {
    return null;
  }

  reservedForSlot.add(cubicle.id);
  reservedCubicles.set(key, reservedForSlot);

  return cubicle;
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

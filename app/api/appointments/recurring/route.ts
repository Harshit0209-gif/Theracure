import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { appointments, recurringInfo } = await request.json();
    console.log("api call with appointments: ", appointments);

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

          // Check for existing appointments at the same time
          const existingAppointment = await prisma.appointment.findFirst({
            where: {
              therapistId: appointment.therapistId,
              assignedDate: appointment.assignedDate,
              OR: [
                {
                  AND: [
                    {
                      appointmentStartTime: {
                        lte: appointment.appointmentStartTime,
                      },
                    },
                    {
                      appointmentEndTime: {
                        gt: appointment.appointmentStartTime,
                      },
                    },
                  ],
                },
                {
                  AND: [
                    {
                      appointmentStartTime: {
                        lt: appointment.appointmentEndTime,
                      },
                    },
                    {
                      appointmentEndTime: {
                        gte: appointment.appointmentEndTime,
                      },
                    },
                  ],
                },
                {
                  AND: [
                    {
                      appointmentStartTime: {
                        gte: appointment.appointmentStartTime,
                      },
                    },
                    {
                      appointmentEndTime: {
                        lte: appointment.appointmentEndTime,
                      },
                    },
                  ],
                },
              ],
              status: {
                notIn: [
                  AppointmentStatus.CANCELLED,
                  AppointmentStatus.COMPLETED,
                ],
              },
            },
          });

          return {
            index,
            appointment,
            isAvailable,
            hasConflict: !!existingAppointment,
            existingAppointment,
          };
        } catch (error) {
          return {
            index,
            appointment,
            isAvailable: false,
            hasConflict: true,
            error: (error as Error).message,
          };
        }
      }),
    );

    // Check for conflicts
    const conflicts = validationResults.filter(
      (result) => !result.isAvailable || result.hasConflict,
    );

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Some appointments have conflicts",
          conflicts: conflicts.map((conflict) => ({
            date: conflict.appointment.appointmentDate,
            reason: conflict.hasConflict
              ? "Time slot already booked"
              : "Therapist not available",
          })),
        },
        { status: 409 },
      );
    }

    // Create all appointments in a transaction with extended timeout
    const createdAppointments = await prisma.$transaction(
      async (tx) => {
        const results = [];

        for (const appointment of appointments) {
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
        details: (error as Error).message,
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

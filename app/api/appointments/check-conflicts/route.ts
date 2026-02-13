import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import {
  conflictCheckSchema,
  ConflictCheckRequest,
} from "@/lib/validations/appointment";
import { safeValidate, validationErrorResponse } from "@/lib/utils/validation";
import { AppointmentStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request using modular validation
    const validation = safeValidate(conflictCheckSchema, body);

    if (!validation.success) {
      return validationErrorResponse(validation.error);
    }

    const data = validation.data;
    if (!data) {
      return NextResponse.json(
        { error: "Invalid validation data" },
        { status: 400 }
      );
    }

    const {
      therapistId,
      appointmentStartTime,
      appointmentEndTime,
      excludeAppointmentId,
    } = data;

    // Convert validated strings to Date objects
    const startTime = new Date(appointmentStartTime);
    const endTime = new Date(appointmentEndTime);

    // NEW LOGIC: Check cubicle availability instead of therapist time conflicts
    // Get all active cubicles
    const allCubicles = await prisma.cubicle.findMany({
      where: {
        status: "ACTIVE",
      },
    });

    // Find appointments that overlap with the requested time range
    const overlappingAppointments = await prisma.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          {
            AND: [
              { appointmentStartTime: { lte: startTime } },
              { appointmentEndTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { lt: endTime } },
              { appointmentEndTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { appointmentStartTime: { gte: startTime } },
              { appointmentEndTime: { lte: endTime } },
            ],
          },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            patientName: true,
          },
        },
        cubicle: true,
      },
    });

    // Get occupied cubicle IDs
    const occupiedCubicleIds = overlappingAppointments
      .map((apt) => apt.cubicleId)
      .filter((id): id is string => id !== null);

    // Check if there are available cubicles
    const availableCubicles = allCubicles.filter(
      (cubicle) => !occupiedCubicleIds.includes(cubicle.id)
    );

    // Get therapist's appointments at this time (for information purposes)
    const therapistAppointments = overlappingAppointments.filter(
      (apt) => apt.therapistId === therapistId
    );

    // Format conflicts for better readability
    const formattedConflicts = overlappingAppointments.map((conflict) => ({
      id: conflict.id,
      patientId: conflict.patient?.id,
      patientName: conflict.patient?.patientName,
      cubicle: conflict.cubicle?.name,
      startTime: conflict.appointmentStartTime.toISOString(),
      endTime: conflict.appointmentEndTime.toISOString(),
      duration: Math.round(
        (conflict.appointmentEndTime.getTime() -
          conflict.appointmentStartTime.getTime()) /
          (1000 * 60)
      ),
    }));

    // Conflict exists only if NO cubicles are available
    const hasConflicts = availableCubicles.length === 0;

    return NextResponse.json({
      success: true,
      hasConflicts,
      conflictCount: hasConflicts ? allCubicles.length : 0,
      conflicts: formattedConflicts,
      availableCubicles: availableCubicles.length,
      totalCubicles: allCubicles.length,
      therapistHasAppointment: therapistAppointments.length > 0,
      therapistAppointmentCount: therapistAppointments.length,
      message: hasConflicts
        ? `All ${allCubicles.length} cubicles are occupied. Please choose a different time.`
        : `${availableCubicles.length} cubicle(s) available for this time slot`,
    });
  } catch (error) {
    console.error("Error checking conflicts:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to check conflicts",
      },
      { status: 500 }
    );
  }
}

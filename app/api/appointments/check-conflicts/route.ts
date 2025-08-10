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

    // Check for conflicts in database
    const conflicts = await prisma.appointment.findMany({
      where: {
        therapistId,
        status: { in: [AppointmentStatus.CONFIRMED] },
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
      },
      orderBy: {
        appointmentStartTime: "asc",
      },
    });

    // Format conflicts for better readability
    const formattedConflicts = conflicts.map((conflict) => ({
      id: conflict.id,
      patientId: conflict.patient?.id,
      patientName: conflict.patient?.patientName,
      therapyType: conflict,
      startTime: conflict.appointmentStartTime.toISOString(),
      endTime: conflict.appointmentEndTime.toISOString(),
      duration: Math.round(
        (conflict.appointmentEndTime.getTime() -
          conflict.appointmentStartTime.getTime()) /
          (1000 * 60)
      ),
    }));

    return NextResponse.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflictCount: conflicts.length,
      conflicts: formattedConflicts,
      message:
        conflicts.length > 0
          ? `Found ${conflicts.length} conflicting appointment(s)`
          : "No conflicts found - time slot is available",
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

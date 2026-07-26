import { NextRequest, NextResponse } from "next/server";

import { AppointmentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateAppointmentDate } from "@/lib/utils/appointmentDateValidation";
import {
  getClinicDateKey,
  isValidDate,
  isTherapistWorkingDuringSlot,
} from "@/lib/utils/appointmentScheduling";
import {
  assignCubiclesForRecurringBatch,
  findDuplicateRecurringOccurrences,
  normalizeAndValidateRecurringAppointments,
  RecurringConflict,
  validateRecurringInfo,
} from "@/lib/utils/recurringAppointmentScheduler";
import { createDraftInvoiceForAppointment } from "@/lib/services/appointment-invoice-service";

export async function POST(request: NextRequest) {
  try {
    const { appointments, recurringInfo } = await request.json();

    const recurringInfoError = validateRecurringInfo(recurringInfo);
    if (recurringInfoError) {
      return NextResponse.json(
        { error: recurringInfoError },
        { status: 400 },
      );
    }

    const parsed = normalizeAndValidateRecurringAppointments(appointments);
    if (parsed.conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Some appointments have invalid input",
          conflicts: parsed.conflicts.map((conflict) => ({
            date: conflict.date,
            reason: conflict.reason,
          })),
        },
        { status: 400 },
      );
    }
    const normalizedAppointments = parsed.appointments;

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

    const conflicts: Array<{ date: string; reason: string }> = [];

    const patientIds = [...new Set(normalizedAppointments.map((a) => a.patientId))];
    const therapistIds = [...new Set(normalizedAppointments.map((a) => a.therapistId))];
    const serviceIds = [...new Set(normalizedAppointments.flatMap((a) => a.serviceIds))];
    const createdByIds = [...new Set(normalizedAppointments.map((a) => a.createdById))];

    const [patients, therapists, services, creators] = await Promise.all([
      prisma.patient.findMany({ where: { id: { in: patientIds } }, select: { id: true } }),
      prisma.therapist.findMany({ where: { id: { in: therapistIds } }, select: { id: true } }),
      prisma.service.findMany({ where: { id: { in: serviceIds } }, select: { id: true } }),
      prisma.user.findMany({ where: { id: { in: createdByIds } }, select: { id: true } }),
    ]);

    const existingPatientIds = new Set(patients.map((item) => item.id));
    const existingTherapistIds = new Set(therapists.map((item) => item.id));
    const existingServiceIds = new Set(services.map((item) => item.id));
    const existingCreatorIds = new Set(creators.map((item) => item.id));

    for (const appointment of normalizedAppointments) {
      if (!isValidDate(appointment._slotStart) || !isValidDate(appointment._slotEnd)) {
        conflicts.push({
          date: appointment.appointmentDate,
          reason: "Invalid appointment date/time format",
        });
        continue;
      }

      if (getClinicDateKey(appointment._slotStart) !== appointment.appointmentDate) {
        conflicts.push({
          date: appointment.appointmentDate,
          reason: "Appointment date must match appointment start time in clinic timezone",
        });
        continue;
      }

      if (!existingPatientIds.has(appointment.patientId)) {
        conflicts.push({ date: appointment.appointmentDate, reason: "Patient not found" });
        continue;
      }
      if (!existingTherapistIds.has(appointment.therapistId)) {
        conflicts.push({ date: appointment.appointmentDate, reason: "Therapist not found" });
        continue;
      }
      if (!appointment.serviceIds.every((sid) => existingServiceIds.has(sid))) {
        conflicts.push({ date: appointment.appointmentDate, reason: "Service not found" });
        continue;
      }
      if (!existingCreatorIds.has(appointment.createdById)) {
        conflicts.push({ date: appointment.appointmentDate, reason: "Creator user not found" });
        continue;
      }

      const dateError = await validateAppointmentDate(appointment.appointmentDate);
      if (dateError) {
        conflicts.push({
          date: appointment.appointmentDate,
          reason: dateError,
        });
        continue;
      }

      const therapistAvailable = await isTherapistWorkingDuringSlot(
        prisma,
        appointment.therapistId,
        appointment._slotStart,
        appointment._slotEnd,
      );
      if (!therapistAvailable) {
        conflicts.push({
          date: appointment.appointmentDate,
          reason: "Therapist not available during this time slot",
        });
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          error: "Some appointments have conflicts",
          conflicts,
        },
        { status: 409 },
      );
    }

    let createdAppointments;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        createdAppointments = await prisma.$transaction(
          async (tx) => {
        const results = [];
        const assignmentResult = await assignCubiclesForRecurringBatch(
          tx,
          normalizedAppointments,
        );
        if (assignmentResult.conflicts.length > 0) {
          throw new Error(
            `RECURRING_CONFLICT:${JSON.stringify(assignmentResult.conflicts)}`,
          );
        }

        for (const appointment of normalizedAppointments) {
          const assignedCubicleId = assignmentResult.assignments.get(
            appointment._index,
          );
          if (!assignedCubicleId) {
            throw new Error(
              `No cubicle assigned for ${appointment.appointmentDate} (${appointment.appointmentStartTime})`,
            );
          }

          const createdAppointment = await tx.appointment.create({
            data: {
              patientId: appointment.patientId,
              therapistId: appointment.therapistId,
              services: {
                create: appointment.serviceIds.map((serviceId) => ({
                  service: { connect: { id: serviceId } },
                })),
              },
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
              cubicleId: assignedCubicleId,
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
              services: {
                include: {
                  service: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      category: true,
                    },
                  },
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

          await createDraftInvoiceForAppointment(tx, {
            appointmentId: createdAppointment.id,
            patientId: appointment.patientId,
            serviceIds: appointment.serviceIds,
            createdById: appointment.createdById,
          });

          results.push({
            ...createdAppointment,
            services: createdAppointment.services.map((s) => s.service),
          });
        }

        return results;
      },
      {
        timeout: 30000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
        );
        break;
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "P2034" && attempt < 2) {
          continue;
        }
        throw error;
      }
    }

    if (!createdAppointments) {
      return NextResponse.json(
        { error: "Unable to create recurring appointments due to concurrent booking conflicts" },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      appointments: createdAppointments,
      message: `Successfully created ${createdAppointments.length} recurring appointments`,
    });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("RECURRING_CONFLICT:")) {
      try {
        const serialized = error.message.replace("RECURRING_CONFLICT:", "");
        const conflictList = JSON.parse(serialized) as RecurringConflict[];
        return NextResponse.json(
          {
            error: "Some appointments have conflicts",
            conflicts: conflictList.map((conflict) => ({
              date: conflict.date,
              reason: conflict.reason,
            })),
          },
          { status: 409 },
        );
      } catch {
        // Fall through to generic handler on parse failure.
      }
    }

    console.error("Error creating recurring appointments:", error);
    return NextResponse.json(
      {
        error: "Failed to create recurring appointments",
      },
      { status: 500 },
    );
  }
}

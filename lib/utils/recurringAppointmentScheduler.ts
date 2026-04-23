import { getCubicleAvailabilityForSlot, hasTimeOverlap } from "@/lib/utils/appointmentScheduling";

export type RawRecurringAppointment = {
  patientId: string;
  therapistId: string;
  serviceId: string;
  createdById: string;
  notes?: string;
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
};

export type NormalizedRecurringAppointment = RawRecurringAppointment & {
  appointmentDate: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  _slotStart: Date;
  _slotEnd: Date;
  _index: number;
};

export type RecurringConflict = {
  index: number;
  date: string;
  reason: string;
};

export function validateRecurringInfo(recurringInfo: unknown) {
  const info = recurringInfo as
    | {
        type?: string;
        endType?: string;
        endDate?: string;
        count?: number;
      }
    | undefined;

  if (!info?.type || !info?.endType) {
    return "Invalid recurring configuration";
  }

  const endType = String(info.endType).toUpperCase();

  if (endType === "DATE") {
    if (!info.endDate || Number.isNaN(new Date(info.endDate).getTime())) {
      return "Recurring end date is required for DATE recurrence";
    }
  }

  if (endType === "COUNT") {
    if (!Number.isInteger(info.count) || (info.count ?? 0) <= 0) {
      return "Recurring count must be a positive integer for COUNT recurrence";
    }
  }

  return null;
}

export function normalizeAndValidateRecurringAppointments(
  appointments: unknown,
): { appointments: NormalizedRecurringAppointment[]; conflicts: RecurringConflict[] } {
  if (!Array.isArray(appointments) || appointments.length === 0) {
    return {
      appointments: [],
      conflicts: [{ index: -1, date: "", reason: "Invalid appointments data" }],
    };
  }

  const conflicts: RecurringConflict[] = [];
  const normalized: NormalizedRecurringAppointment[] = [];

  appointments.forEach((item, index) => {
    const appointment = item as Partial<RawRecurringAppointment>;
    const missingField =
      !appointment.patientId ||
      !appointment.therapistId ||
      !appointment.serviceId ||
      !appointment.createdById ||
      !appointment.appointmentDate ||
      !appointment.appointmentStartTime ||
      !appointment.appointmentEndTime;

    if (missingField) {
      conflicts.push({
        index,
        date: String(appointment.appointmentDate ?? ""),
        reason: "Missing required appointment fields",
      });
      return;
    }

    const patientId = appointment.patientId!;
    const therapistId = appointment.therapistId!;
    const serviceId = appointment.serviceId!;
    const createdById = appointment.createdById!;
    const appointmentDate = appointment.appointmentDate!;
    const appointmentStartTime = appointment.appointmentStartTime!;
    const appointmentEndTime = appointment.appointmentEndTime!;

    const slotDate = new Date(appointmentDate);
    const slotStart = new Date(appointmentStartTime);
    const slotEnd = new Date(appointmentEndTime);

    if (
      Number.isNaN(slotDate.getTime()) ||
      Number.isNaN(slotStart.getTime()) ||
      Number.isNaN(slotEnd.getTime())
    ) {
      conflicts.push({
        index,
        date: appointmentDate,
        reason: "Invalid appointment date/time format",
      });
      return;
    }

    if (slotStart >= slotEnd) {
      conflicts.push({
        index,
        date: appointmentDate,
        reason: "Appointment end time must be after start time",
      });
      return;
    }

    normalized.push({
      patientId,
      therapistId,
      serviceId,
      createdById,
      notes: appointment.notes ?? "",
      appointmentDate: normalizeDateOnly(appointmentDate),
      appointmentStartTime: slotStart.toISOString(),
      appointmentEndTime: slotEnd.toISOString(),
      _slotStart: slotStart,
      _slotEnd: slotEnd,
      _index: index,
    });
  });

  return { appointments: normalized, conflicts };
}

export function findDuplicateRecurringOccurrences(
  appointments: NormalizedRecurringAppointment[],
): RecurringConflict[] {
  const seen = new Set<string>();
  const conflicts: RecurringConflict[] = [];

  for (const appointment of appointments) {
    const key = [
      appointment.patientId,
      appointment.therapistId,
      appointment.appointmentDate,
      appointment.appointmentStartTime,
      appointment.appointmentEndTime,
    ].join("|");

    if (seen.has(key)) {
      conflicts.push({
        index: appointment._index,
        date: appointment.appointmentDate,
        reason:
          "Duplicate recurring occurrence generated for the same patient and time slot",
      });
      continue;
    }

    seen.add(key);
  }

  return conflicts;
}

export async function assignCubiclesForRecurringBatch(
  db: Parameters<typeof getCubicleAvailabilityForSlot>[0],
  appointments: NormalizedRecurringAppointment[],
): Promise<{ assignments: Map<number, string>; conflicts: RecurringConflict[] }> {
  const reservations: Array<{ start: Date; end: Date; cubicleId: string }> = [];
  const assignments = new Map<number, string>();
  const conflicts: RecurringConflict[] = [];

  const orderedAppointments = [...appointments].sort(
    (a, b) => a._slotStart.getTime() - b._slotStart.getTime(),
  );

  for (const appointment of orderedAppointments) {
    const availability = await getCubicleAvailabilityForSlot(
      db,
      appointment._slotStart,
      appointment._slotEnd,
    );

    const internallyBlockedCubicles = new Set(
      reservations
        .filter((reservation) =>
          hasTimeOverlap(
            appointment._slotStart,
            appointment._slotEnd,
            reservation.start,
            reservation.end,
          ),
        )
        .map((reservation) => reservation.cubicleId),
    );

    const selectedCubicle = availability.availableCubicles.find(
      (cubicle) => !internallyBlockedCubicles.has(cubicle.id),
    );

    if (!selectedCubicle) {
      conflicts.push({
        index: appointment._index,
        date: appointment.appointmentDate,
        reason: "No cubicles available for this time slot",
      });
      continue;
    }

    reservations.push({
      start: appointment._slotStart,
      end: appointment._slotEnd,
      cubicleId: selectedCubicle.id,
    });
    assignments.set(appointment._index, selectedCubicle.id);
  }

  return { assignments, conflicts };
}

function normalizeDateOnly(date: string) {
  return new Date(date).toISOString().split("T")[0];
}

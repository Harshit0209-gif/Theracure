import {
  AppointmentStatus,
  CubicleStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import {
  formatTimeInClinicTimeZone,
  getClinicWeekDayFromDateTime,
} from "@/lib/utils/clinicDateTime";

type PrismaClientLike = Prisma.TransactionClient | PrismaClient;
const CLINIC_TIME_ZONE = "Asia/Kolkata";

export function hasTimeOverlap(startA: Date, endA: Date, startB: Date, endB: Date) {
  return startA < endB && startB < endA;
}

export function isValidDate(value: Date) {
  return !Number.isNaN(value.getTime());
}

export function getClinicDateKey(value: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: CLINIC_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

export async function isTherapistWorkingDuringSlot(
  db: PrismaClientLike,
  therapistId: string,
  startTime: Date,
  endTime: Date,
) {
  const weekDay = getClinicWeekDayFromDateTime(startTime);
  const startTimeStr = formatTimeInClinicTimeZone(startTime);
  const endTimeStr = formatTimeInClinicTimeZone(endTime);

  const workingSlot = await db.therapistTimeSlot.findFirst({
    where: {
      therapistId,
      weekDay,
      isAvailable: true,
      startTime: { lte: startTimeStr },
      endTime: { gte: endTimeStr },
    },
    select: { id: true },
  });

  if (!workingSlot) {
    return false;
  }

  const breakSlots = await db.therapistTimeSlot.findMany({
    where: { therapistId, weekDay, isAvailable: false },
    select: { startTime: true, endTime: true },
  });

  const requestedStart = new Date(`2000-01-01T${startTimeStr}:00`);
  const requestedEnd = new Date(`2000-01-01T${endTimeStr}:00`);

  for (const breakSlot of breakSlots) {
    const breakStart = new Date(`2000-01-01T${breakSlot.startTime}:00`);
    const breakEnd = new Date(`2000-01-01T${breakSlot.endTime}:00`);
    if (hasTimeOverlap(requestedStart, requestedEnd, breakStart, breakEnd)) {
      return false;
    }
  }

  return true;
}

export async function getCubicleAvailabilityForSlot(
  db: PrismaClientLike,
  startTime: Date,
  endTime: Date,
  requestedCubicleId?: string,
) {
  const [allCubicles, overlappingAppointments] = await Promise.all([
    db.cubicle.findMany({
      where: { status: CubicleStatus.ACTIVE },
      orderBy: { name: "asc" },
      select: { id: true, name: true, roomNumber: true, location: true },
    }),
    db.appointment.findMany({
      where: {
        status: AppointmentStatus.CONFIRMED,
        appointmentStartTime: { lt: endTime },
        appointmentEndTime: { gt: startTime },
      },
      select: { cubicleId: true },
    }),
  ]);

  const occupiedCubicleIds = new Set(
    overlappingAppointments
      .map((appointment) => appointment.cubicleId)
      .filter((id): id is string => Boolean(id)),
  );

  const availableCubicles = allCubicles.filter(
    (cubicle) => !occupiedCubicleIds.has(cubicle.id),
  );

  let selectedCubicle = null;

  if (requestedCubicleId) {
    const requestedCubicle = allCubicles.find((c) => c.id === requestedCubicleId);
    if (!requestedCubicle) {
      return {
        hasAvailableCubicle: false,
        allCubicles,
        availableCubicles,
        selectedCubicle: null,
        reason: "Selected cubicle not found or inactive",
      } as const;
    }

    if (occupiedCubicleIds.has(requestedCubicleId)) {
      return {
        hasAvailableCubicle: false,
        allCubicles,
        availableCubicles,
        selectedCubicle: null,
        reason: "Selected cubicle is not available during this time slot.",
      } as const;
    }

    selectedCubicle = requestedCubicle;
  } else {
    selectedCubicle = availableCubicles[0] ?? null;
  }

  return {
    hasAvailableCubicle: Boolean(selectedCubicle),
    allCubicles,
    availableCubicles,
    selectedCubicle,
    reason: selectedCubicle ? null : "No cubicles available during this time slot",
  } as const;
}

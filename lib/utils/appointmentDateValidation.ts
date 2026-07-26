import { prisma } from "@/lib/prisma";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export interface ClinicClosedResult {
  closed: boolean;
  reason: string | null;
}

/**
 * Single reusable check for whether the clinic is closed on a given date —
 * combines the admin-configurable weekly-off days and the holiday list
 * (including holidays marked to recur every year on the same month/day).
 * Every module that needs to know "is this date bookable" should call this.
 */
export async function isClinicClosed(
  date: Date | string,
): Promise<ClinicClosedResult> {
  const d = new Date(date);
  const dayOfWeek = d.getDay();

  const weeklyOff = await prisma.weeklyOffConfiguration.findFirst({
    where: { weekDay: dayOfWeek, isActive: true },
  });
  if (weeklyOff) {
    return {
      closed: true,
      reason: `Clinic is closed on ${DAY_NAMES[dayOfWeek]}s.`,
    };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  const exactHoliday = await prisma.holiday.findFirst({
    where: { isActive: true, date: new Date(dateStr) },
  });
  if (exactHoliday) {
    return {
      closed: true,
      reason: `${exactHoliday.name} is a holiday. Appointments cannot be booked on this day.`,
    };
  }

  const recurringHolidays = await prisma.holiday.findMany({
    where: { isActive: true, isRecurring: true },
  });
  const recurringMatch = recurringHolidays.find((holiday) => {
    const hd = new Date(holiday.date);
    return (
      hd.getUTCMonth() === d.getMonth() && hd.getUTCDate() === d.getDate()
    );
  });
  if (recurringMatch) {
    return {
      closed: true,
      reason: `${recurringMatch.name} is a holiday. Appointments cannot be booked on this day.`,
    };
  }

  return { closed: false, reason: null };
}

export async function validateAppointmentDate(
  date: Date | string,
): Promise<string | null> {
  const result = await isClinicClosed(date);
  return result.reason;
}

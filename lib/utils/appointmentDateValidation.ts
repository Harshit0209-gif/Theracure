import { prisma } from "@/lib/prisma";

/**
 * Returns an error message if the date falls on a Sunday or a holiday,
 * or null if the date is valid for appointments.
 */
export async function validateAppointmentDate(date: Date | string): Promise<string | null> {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0 = Sunday

  if (dayOfWeek === 0) {
    return "Appointments cannot be booked on Sundays.";
  }

  // Normalize to date string for raw query (YYYY-MM-DD)
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Use raw query until prisma generate is run with the Holiday model
  const holidays = await (prisma as any).$queryRaw`
    SELECT name FROM holidays WHERE date = ${dateStr}::date LIMIT 1
  `;

  if (holidays && (holidays as any[]).length > 0) {
    const holidayName = (holidays as any[])[0].name;
    return `${holidayName} is a holiday. Appointments cannot be booked on this day.`;
  }

  return null;
}

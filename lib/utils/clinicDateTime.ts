const CLINIC_TIME_ZONE = "Asia/Kolkata";

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function formatTimeInClinicTimeZone(date: Date): string {
  // Use Intl.DateTimeFormat for a deterministic HH:mm output (e.g. "09:30")
  // toLocaleTimeString is locale-runtime dependent and may return "9:30" vs "09:30"
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: CLINIC_TIME_ZONE,
  }).formatToParts(date);

  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export function getClinicWeekDayFromDate(date: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: CLINIC_TIME_ZONE,
  }).format(new Date(`${date}T00:00:00+05:30`));

  return WEEKDAY_INDEX[weekday];
}

export function getClinicWeekDayFromDateTime(date: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: CLINIC_TIME_ZONE,
  }).format(date);

  return WEEKDAY_INDEX[weekday];
}

export function getClinicDayBounds(date: string): {
  startOfDay: Date;
  endOfDay: Date;
} {
  return {
    startOfDay: new Date(`${date}T00:00:00+05:30`),
    endOfDay: new Date(`${date}T23:59:59.999+05:30`),
  };
}

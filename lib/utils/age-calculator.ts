export interface CalculatedAge {
  years: number;
  months: number;
  days: number;
  formatted: string;
}

export function calculateAge(
  dateOfBirth: Date | string | null | undefined,
  referenceDate: Date = new Date()
): CalculatedAge | null {
  if (!dateOfBirth) {
    return null;
  }

  const dob =
    typeof dateOfBirth === "string" ? new Date(dateOfBirth) : dateOfBirth;

  if (isNaN(dob.getTime()) || dob.getTime() > referenceDate.getTime()) {
    return null;
  }

  let years = referenceDate.getFullYear() - dob.getFullYear();
  let months = referenceDate.getMonth() - dob.getMonth();
  let days = referenceDate.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      0
    ).getDate();
    days += daysInPrevMonth;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const units: Array<[number, string]> = [
    [years, "Year"],
    [months, "Month"],
    [days, "Day"],
  ];
  const nonZeroUnits = units.filter(([value]) => value > 0);
  const unitsToFormat =
    nonZeroUnits.length > 0 ? nonZeroUnits : [units[units.length - 1]];
  const formatted = unitsToFormat
    .map(([value, label]) => `${value} ${label}${value !== 1 ? "s" : ""}`)
    .join(" ");

  return { years, months, days, formatted };
}

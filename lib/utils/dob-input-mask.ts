export const DEFAULT_TWO_DIGIT_YEAR_PIVOT = 30;

export interface ParsedDob {
  valid: true;
  isoDate: string;
}

export interface InvalidDob {
  valid: false;
  error: string;
}

export function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);

  let out = digits;
  if (digits.length >= 2) {
    out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  if (digits.length >= 4) {
    out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }
  return out;
}

export function expandTwoDigitYear(
  yy: number,
  pivot: number = DEFAULT_TWO_DIGIT_YEAR_PIVOT
): number {
  return yy < pivot ? 2000 + yy : 1900 + yy;
}

function isValidCalendarDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function parseDobInput(
  display: string,
  pivot: number = DEFAULT_TWO_DIGIT_YEAR_PIVOT
): ParsedDob | InvalidDob {
  const match = /^(\d{2})\/(\d{2})\/(\d{2}|\d{4})$/.exec(display.trim());
  if (!match) {
    return {
      valid: false,
      error: "Date of birth must be in DD/MM/YYYY format",
    };
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = match[3];
  const year =
    rawYear.length === 2
      ? expandTwoDigitYear(Number(rawYear), pivot)
      : Number(rawYear);

  if (month < 1 || month > 12) {
    return { valid: false, error: "Month must be between 01 and 12" };
  }
  if (day < 1 || day > 31) {
    return { valid: false, error: "Day must be between 01 and 31" };
  }
  if (!isValidCalendarDate(year, month, day)) {
    return { valid: false, error: "Date of birth is not a valid calendar date" };
  }

  const referenceDate = new Date();
  referenceDate.setHours(0, 0, 0, 0);
  if (new Date(year, month - 1, day).getTime() > referenceDate.getTime()) {
    return { valid: false, error: "Date of birth cannot be in the future" };
  }

  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { valid: true, isoDate };
}

export function formatIsoToDisplay(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) {
    return "";
  }
  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  description?: string | null;
  isRecurring: boolean;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface WeeklyOffDay {
  weekDay: number;
  isActive: boolean;
}

import { z } from "zod";

export const createHolidaySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Holiday date must be in YYYY-MM-DD format"),
  name: z.string().min(1, "Holiday name is required"),
  description: z.string().optional().nullable(),
  isRecurring: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const updateHolidaySchema = createHolidaySchema.partial();

export const weeklyOffUpdateSchema = z.object({
  activeWeekDays: z
    .array(z.number().int().min(0).max(6))
    .max(7, "There are only 7 days in a week"),
});

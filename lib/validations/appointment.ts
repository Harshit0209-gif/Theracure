import { z } from "zod";
import {
  AppointmentStatus,
  RecurringEndType,
  RecurringType,
} from "@/lib/generated/bookingEnums";
import { ServiceCategory } from "../generated/serviceEnums";

export const appointmentFields = {
  therapistId: z.string().uuid("Invalid therapist ID format"),
  patientId: z.string().min(1, "Patient ID is required"),
  appointmentStartTime: z
    .string()
    .datetime("Invalid start time format (use ISO 8601)"),
  appointmentEndTime: z
    .string()
    .datetime("Invalid end time format (use ISO 8601)"),

  notes: z.string().optional(),
  assignmentId: z.string().uuid("Invalid assignment ID format"),
  status: z.nativeEnum(AppointmentStatus, {
    errorMap: () => ({
      message: "Status must be one of: confirmed, completed, cancelled",
    }),
  }),
  duration: z
    .number()
    .min(15, "Duration must be at least 15 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),

  isRecurring: z.boolean(),
  recurringType: z
    .nativeEnum(RecurringType, {
      errorMap: () => ({
        message: "Recurring type must be one of: weekly, biweekly, monthly",
      }),
    })
    .optional(),

  recurringEndType: z
    .nativeEnum(RecurringEndType, {
      errorMap: () => ({
        message: "Recurring end type must be one of: count, date",
      }),
    })
    .optional(),
  recurringCount: z
    .number()
    .int()
    .min(0, "Recurring count must be at least 0")
    .max(52, "Recurring count cannot exceed 52")
    .optional(),
  recurringEndDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Recurring end date must be in YYYY-MM-DD format"
    )
    .optional()
    .nullable(),
  customDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"))
    .optional(),
  isRecurringParent: z.boolean().default(false),
  recurringParentId: z
    .string()
    .uuid("Invalid recurring parent ID format")
    .optional(),

  serviceId: z.string(),
  serviceCategory: z.nativeEnum(ServiceCategory, {
    errorMap: () => ({
      message:
        "Service category must be one of: manual_therapy, exercise_therapy, consultation, electrotherapy, combo_treatment",
    }),
  }),

  appointmentDate: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      "Appointment date must be in YYYY-MM-DD format"
    ),
  startTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "Start time must be in HH:MM format"
    ),
  endTime: z
    .string()
    .regex(
      /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
      "End time must be in HH:MM format"
    ),

  createdById: z.string().uuid("Invalid creator ID format"),
};

// Custom reusable validation
export const customValidations = {
  // Validates that end time is after start time
  timeSequence: (data: {
    appointmentStartTime: string;
    appointmentEndTime: string;
  }) => {
    const startTime = new Date(data.appointmentStartTime);
    const endTime = new Date(data.appointmentEndTime);
    return endTime > startTime;
  },

  // Validates appointment is not in the past
  notInPast: (appointmentStartTime: string) => {
    const appointmentTime = new Date(appointmentStartTime);
    const now = new Date();
    return appointmentTime > now;
  },

  // Validates appointment is during working hours (9 AM - 7 PM)
  workingHours: (data: {
    appointmentStartTime: string;
    appointmentEndTime: string;
  }) => {
    const startTime = new Date(data.appointmentStartTime);
    const endTime = new Date(data.appointmentEndTime);

    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    const endMinute = endTime.getMinutes();

    // 9 AM to 7 PM (19:00)
    return (
      startHour >= 9 && (endHour < 19 || (endHour === 19 && endMinute === 0))
    );
  },

  // Validates maximum appointment duration
  maxDuration: (
    data: { appointmentStartTime: string; appointmentEndTime: string },
    maxMinutes: number = 240
  ) => {
    const startTime = new Date(data.appointmentStartTime);
    const endTime = new Date(data.appointmentEndTime);
    const durationMinutes =
      (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    return durationMinutes <= maxMinutes;
  },

  // Validates recurring appointment settings
  recurringSettings: (data: {
    isRecurring: boolean;
    recurringType?: RecurringType;
    recurringEndType?: RecurringEndType;
    recurringCount?: number;
    recurringEndDate?: string | null;
    appointmentDate?: string;
    customDates?: string[];
  }) => {
    if (!data.isRecurring) return true;

    if (!data.recurringType) return false;

    // CUSTOM type requires customDates array
    if (data.recurringType === RecurringType.CUSTOM) {
      if (!data.customDates || data.customDates.length === 0) {
        return false;
      }
      // Validate all dates are in the future
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return data.customDates.every(date => new Date(date) >= now);
    }

    // For DAILY, WEEKLY, BIWEEKLY, MONTHLY - need end type
    if (!data.recurringEndType) return false;

    if (
      data.recurringEndType === RecurringEndType.COUNT &&
      (!data.recurringCount || data.recurringCount < 1)
    ) {
      return false;
    }

    if (data.recurringEndType === RecurringEndType.DATE) {
      if (!data.recurringEndDate || !data.appointmentDate) return false;
      const startDate = new Date(data.appointmentDate);
      const endDate = new Date(data.recurringEndDate);
      return endDate > startDate;
    }

    return true;
  },

  // Validates time sequence for form data
  formTimeSequence: (data: {
    startTime: string;
    endTime: string;
    appointmentDate: string;
  }) => {
    const startDateTime = new Date(
      `${data.appointmentDate}T${data.startTime}:00`
    );
    const endDateTime = new Date(`${data.appointmentDate}T${data.endTime}:00`);
    return endDateTime > startDateTime;
  },
};

// ====================================================================
// APPOINTMENT VALIDATION SCHEMAS
// ====================================================================

// 1. Conflict Check Schema
export const conflictCheckSchema = z
  .object({
    therapistId: appointmentFields.therapistId,
    appointmentStartTime: appointmentFields.appointmentStartTime,
    appointmentEndTime: appointmentFields.appointmentEndTime,
    excludeAppointmentId: z.string().uuid().optional(),
  })
  .refine(customValidations.timeSequence, {
    message: "End time must be after start time",
    path: ["appointmentEndTime"],
  })
  .refine((data) => customValidations.workingHours(data), {
    message: "Appointment must be between 9 AM and 7 PM",
    path: ["appointmentStartTime"],
  });

// 2. Enhanced Create Appointment Schema
export const createAppointmentSchema = z
  .object({
    patientId: appointmentFields.patientId,
    therapistId: appointmentFields.therapistId,
    appointmentStartTime: appointmentFields.appointmentStartTime,
    appointmentEndTime: appointmentFields.appointmentEndTime,
    notes: appointmentFields.notes,
    createdById: appointmentFields.createdById,
    serviceId: appointmentFields.serviceId,

    isRecurring: appointmentFields.isRecurring,
    recurringType: appointmentFields.recurringType,
    recurringEndType: appointmentFields.recurringEndType,
    recurringCount: appointmentFields.recurringCount,
    recurringEndDate: appointmentFields.recurringEndDate,
  })
  .refine(customValidations.timeSequence, {
    message: "End time must be after start time",
    path: ["appointmentEndTime"],
  })
  .refine((data) => customValidations.notInPast(data.appointmentStartTime), {
    message: "Cannot schedule appointments in the past",
    path: ["appointmentStartTime"],
  })
  .refine((data) => customValidations.workingHours(data), {
    message: "Appointment must be between 9 AM and 7 PM",
    path: ["appointmentStartTime"],
  })
  .refine((data) => customValidations.maxDuration(data, 240), {
    message: "Appointment duration cannot exceed 4 hours",
    path: ["appointmentEndTime"],
  })
  .refine((data) => customValidations.recurringSettings(data), {
    message: "Invalid recurring appointment settings",
    path: ["isRecurring"],
  });

// 3. Appointment Form Schema (for frontend form validation)
export const appointmentFormSchema = z
  .object({
    patientId: appointmentFields.patientId,
    therapistId: appointmentFields.therapistId,
    appointmentDate: appointmentFields.appointmentDate,
    startTime: appointmentFields.startTime,
    endTime: appointmentFields.endTime,
    serviceCategory: appointmentFields.serviceCategory,
    serviceId: appointmentFields.serviceId,
    notes: appointmentFields.notes,

    isRecurring: appointmentFields.isRecurring,
    recurringType: appointmentFields.recurringType,
    recurringEndType: appointmentFields.recurringEndType,
    recurringCount: appointmentFields.recurringCount,
    recurringEndDate: appointmentFields.recurringEndDate,
    customDates: appointmentFields.customDates,
  })
  .refine((data) => customValidations.formTimeSequence(data), {
    message: "End time must be after start time",
    path: ["endTime"],
  })
  .refine(
    (data) =>
      customValidations.notInPast(
        `${data.appointmentDate}T${data.startTime}:00`
      ),
    {
      message: "Cannot schedule appointments in the past",
      path: ["appointmentDate"],
    }
  )
  .refine(
    (data) =>
      customValidations.workingHours({
        appointmentStartTime: `${data.appointmentDate}T${data.startTime}:00`,
        appointmentEndTime: `${data.appointmentDate}T${data.endTime}:00`,
      }),
    {
      message: "Appointment must be between 9 AM and 7 PM",
      path: ["startTime"],
    }
  )
  .refine(
    (data) =>
      customValidations.maxDuration(
        {
          appointmentStartTime: `${data.appointmentDate}T${data.startTime}:00`,
          appointmentEndTime: `${data.appointmentDate}T${data.endTime}:00`,
        },
        240
      ),
    {
      message: "Appointment duration cannot exceed 4 hours",
      path: ["endTime"],
    }
  )
  .refine((data) => customValidations.recurringSettings(data), {
    message:
      "Invalid recurring appointment settings. Please check recurring type and end settings.",
    path: ["isRecurring"],
  });

// 4. Recurring Appointments Creation Schema
export const createRecurringAppointmentsSchema = z.object({
  appointments: z
    .array(createAppointmentSchema)
    .min(1, "At least one appointment is required"),
  recurringInfo: z.object({
    type: appointmentFields.recurringType.unwrap(),
    endType: appointmentFields.recurringEndType.unwrap(),
    endDate: appointmentFields.recurringEndDate,
    count: appointmentFields.recurringCount,
  }),
});

// 5. Update Appointment Schema
export const updateAppointmentSchema = z
  .object({
    appointmentStartTime: appointmentFields.appointmentStartTime.optional(),
    appointmentEndTime: appointmentFields.appointmentEndTime.optional(),
    status: appointmentFields.status.optional(),
    notes: appointmentFields.notes,
    serviceId: appointmentFields.serviceId,

    updateRecurringType: z
      .enum(["single", "this_and_future", "all"], {
        errorMap: () => ({
          message: "Update type must be one of: single, this_and_future, all",
        }),
      })
      .optional(),

    isRecurring: appointmentFields.isRecurring.optional(),
    recurringType: appointmentFields.recurringType,
    recurringEndType: appointmentFields.recurringEndType,
    recurringCount: appointmentFields.recurringCount,
    recurringEndDate: appointmentFields.recurringEndDate,
  })
  .refine(
    (data) => {
      if (data.appointmentStartTime && data.appointmentEndTime) {
        return customValidations.timeSequence({
          appointmentStartTime: data.appointmentStartTime,
          appointmentEndTime: data.appointmentEndTime,
        });
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["appointmentEndTime"],
    }
  )
  .refine(
    (data) => {
      if (data.isRecurring !== undefined) {
        return customValidations.recurringSettings({
          isRecurring: data.isRecurring,
          recurringType: data.recurringType,
          recurringEndType: data.recurringEndType,
          recurringCount: data.recurringCount,
          recurringEndDate: data.recurringEndDate,
        });
      }
      return true;
    },
    {
      message: "Invalid recurring appointment settings",
      path: ["isRecurring"],
    }
  );

// 6. Enhanced Get Appointments Query Schema
export const getAppointmentsSchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1))
    .default("1"),
  limit: z
    .string()
    .transform((val) => parseInt(val))
    .pipe(z.number().min(1).max(100))
    .default("10"),
  search: z.string().optional(),
  status: appointmentFields.status.optional(),
  therapistId: appointmentFields.therapistId.optional(),
  patientId: appointmentFields.patientId.optional(),
  startDate: appointmentFields.date.optional(),
  endDate: appointmentFields.date.optional(),

  isRecurring: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean())
    .optional(),

  includeRecurring: z
    .string()
    .transform((val) => val === "true")
    .pipe(z.boolean())
    .default("true"),
});

// 7. Therapist Availability Schema (unchanged)
export const therapistAvailabilitySchema = z
  .object({
    therapistId: appointmentFields.therapistId,
    date: appointmentFields.date.optional(),
    startDate: appointmentFields.date.optional(),
    endDate: appointmentFields.date.optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["endDate"],
    }
  );

// 8. Create Availability Schema
export const createAvailabilitySchema = z
  .object({
    therapistId: appointmentFields.therapistId,
    slotDate: appointmentFields.date,
    startTime: appointmentFields.time,
    endTime: appointmentFields.time,
    isRecurring: z.boolean().default(false),
  })
  .refine(
    (data) => {
      const [startHour, startMinute] = data.startTime.split(":").map(Number);
      const [endHour, endMinute] = data.endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      return endMinutes > startMinutes;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

// 10. Recurring Appointment Management Schema
export const recurringManagementSchema = z
  .object({
    action: z.enum(
      ["cancel_all", "cancel_future", "update_all", "update_future"],
      {
        errorMap: () => ({
          message:
            "Action must be one of: cancel_all, cancel_future, update_all, update_future",
        }),
      }
    ),
    fromDate: appointmentFields.date.optional(),
    updateData: z
      .object({
        therapistId: appointmentFields.therapistId.optional(),
        appointmentStartTime: appointmentFields.appointmentStartTime.optional(),
        appointmentEndTime: appointmentFields.appointmentEndTime.optional(),
        notes: appointmentFields.notes.optional(),
        serviceId: appointmentFields.serviceId.optional(),
      })
      .optional(),
  })
  .refine(
    (data) => {
      if (data.action.includes("future") && !data.fromDate) {
        return false;
      }
      if (data.action.includes("update") && !data.updateData) {
        return false;
      }
      return true;
    },
    {
      message: "Invalid recurring management parameters",
      path: ["action"],
    }
  );

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type ConflictCheckRequest = z.infer<typeof conflictCheckSchema>;
export type CreateAppointmentRequest = z.infer<typeof createAppointmentSchema>;
export type AppointmentFormData = z.infer<typeof appointmentFormSchema>;
export type CreateRecurringAppointmentsRequest = z.infer<
  typeof createRecurringAppointmentsSchema
>;
export type UpdateAppointmentRequest = z.infer<typeof updateAppointmentSchema>;
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsSchema>;
export type TherapistAvailabilityQuery = z.infer<
  typeof therapistAvailabilitySchema
>;
export type CreateAvailabilityRequest = z.infer<
  typeof createAvailabilitySchema
>;

export type RecurringManagementRequest = z.infer<
  typeof recurringManagementSchema
>;

// ====================================================================
// HELPER FUNCTIONS
// ====================================================================

// Helper function to generate recurring appointment dates
export const generateRecurringDates = (
  startDate: string,
  recurringType: RecurringType,
  endType: RecurringEndType,
  endValue: number | string,
  customDates?: string[]
): string[] => {
  // For CUSTOM type, return the custom dates directly
  if (recurringType === RecurringType.CUSTOM && customDates) {
    return customDates.sort();
  }

  const dates: string[] = [];
  const start = new Date(startDate);
  let current = new Date(start);

  const increment =
    recurringType === RecurringType.DAILY
      ? 1
      : recurringType === RecurringType.WEEKLY
      ? 7
      : recurringType === RecurringType.BIWEEKLY
      ? 14
      : 28; // MONTHLY

  let endDate: Date;
  if (endType === RecurringEndType.DATE) {
    endDate = new Date(endValue as string);
  } else {
    endDate = new Date(start);
    endDate.setDate(endDate.getDate() + (endValue as number) * increment);
  }

  while (current <= endDate && dates.length < 100) {
    // Safety limit
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + increment);
  }

  return dates;
};

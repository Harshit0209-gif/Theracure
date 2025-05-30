import { z } from "zod"


export const appointmentFields = {
  therapistId: z.string().uuid("Invalid therapist ID format"),
  patientId: z.string().min(1, "Patient ID is required").regex(/^THRC\d{6}$/, "Invalid patient ID format (should be THRC000001)"),
  appointmentStartTime: z.string().datetime("Invalid start time format (use ISO 8601)"),
  appointmentEndTime: z.string().datetime("Invalid end time format (use ISO 8601)"),
  therapyType: z.string().min(1, "Therapy type is required"),
  notes: z.string().optional(),
  assignmentId: z.string().uuid("Invalid assignment ID format"),
  status: z.enum(['confirmed', 'completed', 'cancelled'], {
    errorMap: () => ({ message: "Status must be one of: confirmed, completed, cancelled" })
  }),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(480, "Duration cannot exceed 8 hours"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Time must be in HH:MM format"),
}

// Custom reusable validation
export const customValidations = {
  // Validates that end time is after start time
  timeSequence: (data: { appointmentStartTime: string; appointmentEndTime: string }) => {
    const startTime = new Date(data.appointmentStartTime)
    const endTime = new Date(data.appointmentEndTime)
    return endTime > startTime
  },

  // Validates appointment is not in the past
  notInPast: (appointmentStartTime: string) => {
    const appointmentTime = new Date(appointmentStartTime)
    const now = new Date()
    return appointmentTime > now
  },

  // Validates appointment is during working hours (9 AM - 7 PM)
  workingHours: (data: { appointmentStartTime: string; appointmentEndTime: string }) => {
    const startTime = new Date(data.appointmentStartTime)
    const endTime = new Date(data.appointmentEndTime)
    
    const startHour = startTime.getHours()
    const endHour = endTime.getHours()
    const endMinute = endTime.getMinutes()
    
    // 9 AM to 7 PM (19:00)
    return startHour >= 9 && (endHour < 19 || (endHour === 19 && endMinute === 0))
  },

  // Validates maximum appointment duration
  maxDuration: (data: { appointmentStartTime: string; appointmentEndTime: string }, maxMinutes: number = 240) => {
    const startTime = new Date(data.appointmentStartTime)
    const endTime = new Date(data.appointmentEndTime)
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    return durationMinutes <= maxMinutes
  }
}

// ====================================================================
// APPOINTMENT VALIDATION SCHEMAS
// ====================================================================

// 1. Conflict Check Schema
export const conflictCheckSchema = z.object({
  therapistId: appointmentFields.therapistId,
  appointmentStartTime: appointmentFields.appointmentStartTime,
  appointmentEndTime: appointmentFields.appointmentEndTime,
  excludeAppointmentId: z.string().uuid().optional()
}).refine(
  customValidations.timeSequence,
  {
    message: "End time must be after start time",
    path: ["appointmentEndTime"]
  }
).refine(
  (data) => customValidations.workingHours(data),
  {
    message: "Appointment must be between 9 AM and 7 PM",
    path: ["appointmentStartTime"]
  }
)

// 2. Create Appointment Schema
export const createAppointmentSchema = z.object({
  patientId: appointmentFields.patientId,
  therapistId: appointmentFields.therapistId,
  appointmentStartTime: appointmentFields.appointmentStartTime,
  appointmentEndTime: appointmentFields.appointmentEndTime,
  therapyType: appointmentFields.therapyType,
  notes: appointmentFields.notes,
  createdById: z.string().uuid("Invalid user ID format")
}).refine(
  customValidations.timeSequence,
  {
    message: "End time must be after start time",
    path: ["appointmentEndTime"]
  }
).refine(
  (data) => customValidations.notInPast(data.appointmentStartTime),
  {
    message: "Cannot schedule appointments in the past",
    path: ["appointmentStartTime"]
  }
).refine(
  (data) => customValidations.workingHours(data),
  {
    message: "Appointment must be between 9 AM and 7 PM",
    path: ["appointmentStartTime"]
  }
).refine(
  (data) => customValidations.maxDuration(data, 240), 
  {
    message: "Appointment duration cannot exceed 4 hours",
    path: ["appointmentEndTime"]
  }
)

// 3. Update Appointment Schema
export const updateAppointmentSchema = z.object({
  appointmentStartTime: appointmentFields.appointmentStartTime.optional(),
  appointmentEndTime: appointmentFields.appointmentEndTime.optional(),
  therapyType: appointmentFields.therapyType.optional(),
  status: appointmentFields.status.optional(),
  notes: appointmentFields.notes
}).refine(
  (data) => {
    if (data.appointmentStartTime && data.appointmentEndTime) {
      return customValidations.timeSequence({
        appointmentStartTime: data.appointmentStartTime,
        appointmentEndTime: data.appointmentEndTime
      })
    }
    return true
  },
  {
    message: "End time must be after start time",
    path: ["appointmentEndTime"]
  }
)

// 4. Get Appointments Query Schema
export const getAppointmentsSchema = z.object({
  page: z.string().transform(val => parseInt(val)).pipe(z.number().min(1)).default("1"),
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(100)).default("10"),
  search: z.string().optional(),
  status: appointmentFields.status.optional(),
  therapistId: appointmentFields.therapistId.optional(),
  patientId: appointmentFields.patientId.optional(),
  startDate: appointmentFields.date.optional(),
  endDate: appointmentFields.date.optional()
})

// 5. Therapist Availability Schema
export const therapistAvailabilitySchema = z.object({
  therapistId: appointmentFields.therapistId,
  date: appointmentFields.date.optional(),
  startDate: appointmentFields.date.optional(),
  endDate: appointmentFields.date.optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate)
    }
    return true
  },
  {
    message: "Start date must be before or equal to end date",
    path: ["endDate"]
  }
)

// 6. Create Availability Schema
export const createAvailabilitySchema = z.object({
  therapistId: appointmentFields.therapistId,
  slotDate: appointmentFields.date,
  startTime: appointmentFields.time,
  endTime: appointmentFields.time,
  isRecurring: z.boolean().default(false)
}).refine(
  (data) => {
    const [startHour, startMinute] = data.startTime.split(':').map(Number)
    const [endHour, endMinute] = data.endTime.split(':').map(Number)
    const startMinutes = startHour * 60 + startMinute
    const endMinutes = endHour * 60 + endMinute
    return endMinutes > startMinutes
  },
  {
    message: "End time must be after start time",
    path: ["endTime"]
  }
)

// 7. Bulk Operations Schema
export const bulkOperationsSchema = z.object({
  appointmentIds: z.array(z.string().uuid()).min(1, "At least one appointment ID is required"),
  action: z.enum(['cancel', 'complete', 'reschedule'], {
    errorMap: () => ({ message: "Action must be one of: cancel, complete, reschedule" })
  }),
  data: z.object({
    appointmentStartTime: appointmentFields.appointmentStartTime.optional(),
    appointmentEndTime: appointmentFields.appointmentEndTime.optional(),
    reason: z.string().optional()
  }).optional()
})

// ====================================================================
// TYPE EXPORTS
// ====================================================================

export type ConflictCheckRequest = z.infer<typeof conflictCheckSchema>
export type CreateAppointmentRequest = z.infer<typeof createAppointmentSchema>
export type UpdateAppointmentRequest = z.infer<typeof updateAppointmentSchema>
export type GetAppointmentsQuery = z.infer<typeof getAppointmentsSchema>
export type TherapistAvailabilityQuery = z.infer<typeof therapistAvailabilitySchema>
export type CreateAvailabilityRequest = z.infer<typeof createAvailabilitySchema>
export type BulkOperationsRequest = z.infer<typeof bulkOperationsSchema>
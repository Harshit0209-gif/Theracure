// 🚨 AUTO-GENERATED FILE. DO NOT EDIT MANUALLY!
// Generated from Prisma schema.


export enum RecurringType {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}


export enum RecurringEndType {
  COUNT = "COUNT",
  DATE = "DATE",
}


export enum AssignmentStatus {
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}


export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
}


export enum AppointmentStatus {
  CONFIRMED = "CONFIRMED",
  RESCHEDULED = "RESCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}


export enum ConsultationStatus {
  NOT_ASSIGN = "NOT_ASSIGN",
  ASSIGNED = "ASSIGNED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}


import { AppointmentStatus } from "@/lib/generated/bookingEnums";

export const statusStyles = {
  [AppointmentStatus.CONFIRMED]: "bg-blue-100 text-blue-700",
  [AppointmentStatus.RESCHEDULED]: "bg-yellow-100 text-yellow-800",
  [AppointmentStatus.COMPLETED]: "bg-green-100 text-green-800",
  [AppointmentStatus.CANCELLED]: "bg-red-100 text-red-800",
};

export const statusLabels = {
  [AppointmentStatus.CONFIRMED]: "Confirmed",
  [AppointmentStatus.RESCHEDULED]: "Rescheduled",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
};

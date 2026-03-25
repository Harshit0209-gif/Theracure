import { AppointmentStatus } from "@/lib/generated/bookingEnums";

export const statusStyles = {
  [AppointmentStatus.CONFIRMED]:   "bg-blue-50 text-blue-700 border-0 hover:bg-blue-50",
  [AppointmentStatus.RESCHEDULED]: "bg-amber-50 text-amber-700 border-0 hover:bg-amber-50",
  [AppointmentStatus.COMPLETED]:   "bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-50",
  [AppointmentStatus.CANCELLED]:   "bg-red-50 text-red-600 border-0 hover:bg-red-50",
};

export const statusLabels = {
  [AppointmentStatus.CONFIRMED]: "Confirmed",
  [AppointmentStatus.RESCHEDULED]: "Rescheduled",
  [AppointmentStatus.COMPLETED]: "Completed",
  [AppointmentStatus.CANCELLED]: "Cancelled",
};

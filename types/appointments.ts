import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { PaginationInfo } from "@/types/index";
import { Service } from "@/types/service";

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  assignedDate: Date;
  appointmentStartTime: string;
  appointmentEndTime: string;
  status: AppointmentStatus;
  createdById: string;
  createdAt: string;
  notes?: string;

  service?: Service;

  patient?: {
    id: string;
    patientName: string;
    phone?: string;
    email?: string;
  };

  therapist?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };

  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}
export interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onAppointmentUpdated: () => void;
}

export interface EditAppointmentData {
  therapyType: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  notes: string;
}

export interface RescheduleData {
  appointmentStartTime: string;
  appointmentEndTime: string;
  reason: string;
}

export interface CancelData {
  reason: string;
}

export interface AvailablePeriod {
  startTime: string;
  endTime: string;
  available: boolean;
  duration?: number;
}

export interface TherapistAvailability {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface RecurringPreview {
  date: string;
  dayName: string;
  formattedDate: string;
  status: "available" | "conflict" | "unknown";
}

export interface TherapistAvailability {
  id: string;
  therapistId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

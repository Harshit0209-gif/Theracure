import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { ServiceCategory } from "@/lib/generated/serviceEnums";
import { Service } from "@/types/service";

export interface TodayAppointment {
  id: string;
  patientName: string;
  therapistName: string;
  time: string;
  status: AppointmentStatus;
}

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
  cubicleId?: string;

  services?: Service[];

  invoice?: {
    id: string;
    status: string;
    totalAmount: number;
    amountPaid: number;
  } | null;

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

  cubicle?: {
    id: string;
    name: string;
    roomNumber?: string;
    location?: string;
  };
}
export interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  therapyTypeFilter: string;
  setTherapyTypeFilter: (type: ServiceCategory) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  onAppointmentUpdated: () => void;
  view: "today" | "upcoming" | "all";
  onViewChange: (view: "today" | "upcoming" | "all") => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
}

export interface EditAppointmentData {
  serviceIds: string[];
  notes: string;
  cubicleId: string;
}

export const DefaultEditAppointmentData: EditAppointmentData = {
  serviceIds: [],
  notes: "",
  cubicleId: "",
};

export interface RescheduleAppointmentData {
  date: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  reason: string;
}
export const DefaultRescheduleAppointmentData: RescheduleAppointmentData = {
  date: "",
  appointmentStartTime: "",
  appointmentEndTime: "",
  reason: "",
};

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

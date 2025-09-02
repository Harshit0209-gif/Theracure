export enum ConsultationStatus {
  NOT_ASSIGN = "NOT_ASSIGN",
  ASSIGNED = "ASSIGNED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}
export const ConsultationStatusLabels: Record<ConsultationStatus, string> = {
  [ConsultationStatus.NOT_ASSIGN]: "Not Assigned",
  [ConsultationStatus.ASSIGNED]: "Assigned",
  [ConsultationStatus.COMPLETED]: "Completed",
  [ConsultationStatus.CANCELLED]: "Cancelled",
};
export interface Consultation {
  id: string;
  name: string;
  email?: string;
  consultationWith: string;
  consultationDate: string;
  consultationTime: string;
  status: ConsultationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const statusColor: Record<string, string> = {
  NOT_ASSIGN: "bg-red-100 text-red-700 border-red-200",
  ASSIGNED: "bg-green-100 text-green-700 border-green-200",
  COMPLETED: "bg-indigo-100 text-indigo-700 border-indigo-200",
  CANCELLED: "bg-gray-100 text-gray-700 border-gray-200",
};

export const statusLabels: Record<string, string> = {
  NOT_ASSIGN: "Not Assigned",
  ASSIGNED: "Assigned",
  COMPLETED: "Done",
  CANCELLED: "Cancelled",
};
export interface ConsultationFormValues {
  name: string;
  email?: string;
  consultationWith: string;
  consultationDate: string;
  consultationTime: string;
  status: ConsultationStatus;
}

export interface EditConsultationFormValues {
  id: string;
  name: string;
  email?: string;
  consultationWith: string;
  consultationDate: string;
  consultationTime: string;
  status: ConsultationStatus;
}

export interface ConsultationFilter {
  searchTerm?: string;
  status?: ConsultationStatus;
  consultationWith?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface ConsultationListResponse {
  success: boolean;
  consultations: Consultation[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface ConsultationResponse {
  success: boolean;
  consultation: Consultation;
  message?: string;
}

export interface ConsultationStats {
  total: number;
  notAssigned: number;
  assigned: number;
  completed: number;
  cancelled: number;
}

export interface ConsultationStatsResponse {
  success: boolean;
  stats: ConsultationStats;
}

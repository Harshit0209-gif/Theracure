export interface Appointment {
  id: number;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  status: "scheduled" | "completed" | "cancelled";
}

export interface Invoice {
  id: number;
  clientName: string;
  amount: number;
  date: string;
  status: "paid" | "pending" | "overdue";
}

export interface Client {
  id: number;
  name: string;
  uid: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export const PaginationDefaultValue: PaginationInfo = {
  currentPage: 1,
  totalPages: 1,
  totalCount: 0,
  limit: 20,
  hasNextPage: false,
  hasPreviousPage: false,
};

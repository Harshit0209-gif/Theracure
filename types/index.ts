export interface User {
  id: string
  name: string
  email: string
  role: "receptionist" | "admin"
  avatar?: string
}

export interface Appointment {
  id: number
  patientName: string
  doctorName: string
  date: string
  time: string
  status: "scheduled" | "completed" | "cancelled"
}

export interface Invoice {
  id: number
  clientName: string
  amount: number
  date: string
  status: "paid" | "pending" | "overdue"
}

export interface Client {
  id: number
  name: string
  uid: string
  email?: string
  phone?: string
  address?: string
}

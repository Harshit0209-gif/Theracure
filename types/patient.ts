export interface Patient {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  height?: number;
  weight?: number;
  address?: string;
  phone?: string;
  email?: string;
  medicalHistory?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

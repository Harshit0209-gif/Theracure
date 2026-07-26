import { CalculatedAge } from "@/lib/utils/age-calculator";

export interface Patient {
  id: string;
  patientName: string;
  age: number;
  dateOfBirth?: string;
  calculatedAge?: CalculatedAge | null;
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

export type CreatePatient = Omit<Patient, "id" | "createdAt" | "updatedAt">;

export type UpdatePatient = Partial<Omit<Patient, "id">> & { id: string };

export const defaultPatient: Patient = {
  id: "",
  patientName: "",
  age: 0,
  gender: "other",
  createdBy: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

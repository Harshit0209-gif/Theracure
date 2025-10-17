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

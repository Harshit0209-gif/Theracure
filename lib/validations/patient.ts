import { z } from "zod";

export const patientSchema = z.object({
  id: z.string().optional(),
  patientName: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  address: z.string().min(1, "Address is required"),
  age: z.number().min(0, "Age must be a positive number"),
  gender: z.enum(["male", "female", "other"]),
  height: z.number().min(0, "Height must be a positive number").optional(),
  weight: z.number().min(0, "Weight must be a positive number").optional(),
  medicalHistory: z.string().optional(),
});

export type PatientFormData = z.infer<typeof patientSchema>;

export const patientUpdateSchema = patientSchema.partial();
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

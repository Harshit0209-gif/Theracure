import { z } from "zod";

export const createPatientSchema = z
  .object({
    id: z.string().optional(),
    patientName: z.string().min(3, "Name is required"),
    email: z
      .string()
      .email("Invalid email address")
      .or(z.literal(""))
      .nullable()
      .optional(),
    phone: z
      .string()
      .min(10, "Phone number must be 10 digits")
      .max(10, "Phone number must be 10 digits")
      .regex(/^\d+$/, "Phone number must contain only digits")
      .or(z.literal(""))
      .nullable(),
    address: z.string().min(1, "Address is required"),
    age: z.number().min(0, "Age must be a positive number").optional().nullable(),
    gender: z.enum(["Male", "Female", "Other"]),
    height: z
      .number()
      .min(0, "Height must be a positive number")
      .optional()
      .nullable(),
    weight: z
      .number()
      .min(0, "Weight must be a positive number")
      .optional()
      .nullable(),
    medicalHistory: z.string().nullable().optional(),
  })
  .passthrough();

export const updatePatientSchema = createPatientSchema.partial();

export type PatientFormData = z.infer<typeof createPatientSchema>;

export const patientUpdateSchema = createPatientSchema.partial();
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

import { z } from "zod";

export const consulationSchema = z.object({
  name: z.string().min(3, "Name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z
    .string()
    .min(10, "Phone number must be 10 digits")
    .max(10, "Phone number must be 10 digits")
    .regex(/^\d+$/, "Phone number must contain only digits"),
  address: z.string().min(1, "Address is required"),
  gender: z.enum(["male", "female", "other"]),
  consultationwith: z.string().min(1, "Consultation with is required"),
  note: z.string().optional(),
  consultationDate: z.string(),
  consultationTime: z.string(),
});

export type ConsultationFormData = z.infer<typeof consulationSchema>;

export const patientUpdateSchema = consulationSchema.partial();
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

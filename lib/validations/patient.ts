import { z } from "zod";

const isValidNotFutureDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.getTime() <= Date.now();
};

const patientBaseSchema = z
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
    dateOfBirth: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date of birth must be in YYYY-MM-DD format",
      ),
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

export const createPatientSchema = patientBaseSchema.refine(
  (data) => isValidNotFutureDate(data.dateOfBirth),
  {
    message: "Date of birth must be a valid date and cannot be in the future",
    path: ["dateOfBirth"],
  },
);

export const updatePatientSchema = patientBaseSchema.partial().refine(
  (data) =>
    data.dateOfBirth === undefined || isValidNotFutureDate(data.dateOfBirth),
  {
    message: "Date of birth must be a valid date and cannot be in the future",
    path: ["dateOfBirth"],
  },
);

export type PatientFormData = z.infer<typeof createPatientSchema>;

export const patientUpdateSchema = patientBaseSchema.partial().refine(
  (data) =>
    data.dateOfBirth === undefined || isValidNotFutureDate(data.dateOfBirth),
  {
    message: "Date of birth must be a valid date and cannot be in the future",
    path: ["dateOfBirth"],
  },
);
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

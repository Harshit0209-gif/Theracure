import { z } from "zod";
import { ServiceCategory } from "@/lib/generated/serviceEnums";

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().positive("Price must be positive"),
  category: z.enum([
    ServiceCategory.MANUAL_THERAPY,
    ServiceCategory.CONSULTATION,
    ServiceCategory.ELECTROTHERAPY,
    ServiceCategory.EXERCISE_THERAPY,
    ServiceCategory.COMBO_TREATMENT,
  ]),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type serviceSchemaData = z.infer<typeof serviceSchema>;

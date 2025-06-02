import { z } from "Zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type serviceSchemaData = z.infer<typeof serviceSchema>;

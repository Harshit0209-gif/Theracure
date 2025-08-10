import z from "zod";
import { UserRoleSchema } from "@/lib/userRoles";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  role: UserRoleSchema.default(UserRoleSchema.enum.THERAPIST),
});

import { TypeOf, z } from "zod";
import { UserRoleSchema } from "@/lib/userRoles";
import { UserStatus } from "@prisma/client";

// Schema for creating a new user
export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email must be less than 100 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Must be exactly 10 digits")
    .optional(),
  role: UserRoleSchema,
});

// Schema for updating a user
export const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .min(5, "Email must be at least 5 characters")
    .max(100, "Email must be less than 100 characters")
    .optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be less than 100 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .optional(),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Must be exactly 10 digits")
    .optional()
    .or(z.literal("")),
});

export const deleteUserSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password must be less than 100 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  );

export const updateStatusSchema = z.object({
  status: z
    .enum(Object.values(UserStatus) as [UserStatus, ...UserStatus[]])
    .optional()
    .or(z.literal("")),
});

export type UserUpdateFormData = z.infer<typeof updateUserSchema>;
export type CreateUserFormData = z.infer<typeof createUserSchema>;
export type UpdateUserStatusData = z.infer<typeof updateStatusSchema>;
export type PasswordFormData = z.infer<typeof passwordSchema>;

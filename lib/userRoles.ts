import { UserRole } from "@/lib/generated/userRoles";
import { z } from "zod";
import { User, FileText, Shield, Stethoscope, LucideIcon } from "lucide-react";
import { UserStatus } from "@/lib/generated/userEnums";

export const UserRoleLabel: Record<UserRole, string> = {
  ADMIN: "Admin",
  THERAPIST: "Therapist",
  RECEPTIONIST: "Receptionist",
  CONTENT_MANAGER: "Content Manager",
};

export const AllRoles: UserRole[] = [
  UserRole.ADMIN,
  UserRole.THERAPIST,
  UserRole.RECEPTIONIST,
  UserRole.CONTENT_MANAGER,
];

export const UserStatusLabel: Record<UserStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspend",
};

export const UserRoleSchema = z.enum(AllRoles as [UserRole, ...UserRole[]]);

export const UserRoleDescription: Record<UserRole, string> = {
  ADMIN: "Full system access and user management",
  THERAPIST: "Patient management and treatment records",
  RECEPTIONIST: "Appointment scheduling and patient check-in",
  CONTENT_MANAGER: "Content creation and management",
};

export const RolePermissions = {
  ADMIN: ["all"],
  THERAPIST: ["patients", "appointments", "reports", "treatments"],
  RECEPTIONIST: ["appointments", "patients:read", "calendar"],
  CONTENT_MANAGER: ["content", "reports:read", "media"],
} as const;

export const RoleColors: Record<UserRole, string> = {
  ADMIN: "bg-red-100 text-red-800",
  THERAPIST: "bg-blue-100 text-blue-800",
  RECEPTIONIST: "bg-green-100 text-green-800",
  CONTENT_MANAGER: "bg-purple-100 text-purple-800",
};

export const RoleIcons: Record<UserRole, LucideIcon> = {
  ADMIN: Shield,
  THERAPIST: Stethoscope,
  RECEPTIONIST: User,
  CONTENT_MANAGER: FileText,
};

export const RoleRoutes: Record<UserRole, string> = {
  [UserRole.RECEPTIONIST]: "/receptionist",
  [UserRole.CONTENT_MANAGER]: "/content",
  [UserRole.ADMIN]: "/admin",
  [UserRole.THERAPIST]: "/therapist",
};
export const RoleOptionsMap: Record<
  UserRole,
  {
    value: UserRole;
    label: string;
    icon: LucideIcon;
    description: string;
    color: string;
  }
> = {
  [UserRole.RECEPTIONIST]: {
    value: UserRole.RECEPTIONIST,
    label: UserRoleLabel[UserRole.RECEPTIONIST],
    icon: RoleIcons[UserRole.RECEPTIONIST],
    description: UserRoleDescription[UserRole.RECEPTIONIST],
    color: RoleColors[UserRole.RECEPTIONIST],
  },
  [UserRole.CONTENT_MANAGER]: {
    value: UserRole.CONTENT_MANAGER,
    label: UserRoleLabel[UserRole.CONTENT_MANAGER],
    icon: RoleIcons[UserRole.CONTENT_MANAGER],
    description: UserRoleDescription[UserRole.CONTENT_MANAGER],
    color: RoleColors[UserRole.CONTENT_MANAGER],
  },
  [UserRole.ADMIN]: {
    value: UserRole.ADMIN,
    label: UserRoleLabel[UserRole.ADMIN],
    icon: RoleIcons[UserRole.ADMIN],
    description: UserRoleDescription[UserRole.ADMIN],
    color: RoleColors[UserRole.ADMIN],
  },
  [UserRole.THERAPIST]: {
    value: UserRole.THERAPIST,
    label: UserRoleLabel[UserRole.THERAPIST],
    icon: RoleIcons[UserRole.THERAPIST],
    description: UserRoleDescription[UserRole.THERAPIST],
    color: RoleColors[UserRole.THERAPIST],
  },
};

export const RoleAllowedRoutes: Record<UserRole, string[]> = {
  ADMIN: [
    "/admin",
    "/appointments",
    "/patients",
    "/invoices",
    "/blogs",
    "/announcement",
    "/employees",
    "/consultation",
    "/analytics",
    "/services",
    "/cubicles",
    "/holidays",
    "/prescriptions",
    "/profile",
    "/support",
    "/privacy-policy",
  ],
  RECEPTIONIST: [
    "/receptionist",
    "/appointments",
    "/patients",
    "/invoices",
    "/profile",
    "/support",
    "/privacy-policy",
  ],
  CONTENT_MANAGER: [
    "/content",
    "/blogs",
    "/announcement",
    "/profile",
    "/support",
    "/privacy-policy",
  ],
  THERAPIST: [
    "/therapist",
    "/patients",
    "/prescriptions",
    "/appointments",
    "/profile",
    "/support",
    "/privacy-policy",
  ],
};

export type UserRoleType = z.infer<typeof UserRoleSchema>;
export type RolePermission =
  (typeof RolePermissions)[keyof typeof RolePermissions][number];
export type RoleOption = (typeof RoleOptionsMap)[UserRole];

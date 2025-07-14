import { UserStatus } from "@/lib/generated/userEnums";
import { UserRole } from "@/lib/generated/userRoles";

export interface LoginUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface EditUserFormData {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
}

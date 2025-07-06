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
  status: string;
  createdAt: string;
  updatedAt: string;
}

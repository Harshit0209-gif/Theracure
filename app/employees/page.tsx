"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema } from "@/lib/validations/user";
import { z } from "zod";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/use-toast";

// Components
import { EmployeeStats } from "@/components/employee-stats";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
import { EmployeeTable } from "@/components/employee-table";
import { EmployeeTableHeader } from "@/components/employee-table-header";

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "therapist" | "receptionist" | "content_manager";
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export interface UsersApiResponse {
  success: boolean;
  users: User[];
  pagination: PaginationInfo;
}

type FormData = z.infer<typeof createUserSchema>;

export default function EmployeePage() {
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 5,
  });

  // Fetch users from API
  const fetchUsers = async (
    page: number = 1,
    search: string = "",
    role: string = ""
  ) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(role && role !== "all" && { role }),
      });

      const response = await fetch(`/api/users?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data: UsersApiResponse = await response.json();

      if (data.success) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        throw new Error("API returned error");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1, searchQuery, roleFilter);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, roleFilter]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchUsers(newPage, searchQuery, roleFilter);
  };

  // Handle successful user creation
  const handleUserCreated = () => {
    fetchUsers(pagination.page, searchQuery, roleFilter);
  };

  // Calculate stats from users data
  const stats = {
    total: pagination.total,
    therapists: users.filter((u) => u.role === "therapist").length,
    admins: users.filter((u) => u.role === "admin").length,
    receptionists: users.filter((u) => u.role === "receptionist").length,
    support: users.filter(
      (u) => u.role === "admin" || u.role === "receptionist"
    ).length,
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Employee Management
          </h2>
          <AddEmployeeDialog onUserCreated={handleUserCreated} />
        </div>

        {/* Stats Cards */}
        <EmployeeStats stats={stats} />

        {/* Employee Table */}
        <div className="bg-gray-200 rounded-lg overflow-hidden mb-6 border">
          <EmployeeTableHeader
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />

          <EmployeeTable
            users={users}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onUserUpdated={handleUserCreated}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";
import { User } from "@/types/user";
import { UserRole } from "@/lib/generated/userRoles";
import { UserStatus } from "@/lib/generated/userEnums";
import { AllRoles, UserRoleLabel } from "@/lib/userRoles";
import { EmployeeStats } from "@/components/employee-stats";
import { AddEmployeeDialog } from "@/components/add-employee-dialog";
import { EmployeeTable } from "@/components/employee-table";

const CACHE_LIMIT = 100;

export default function EmployeePage() {
  const [cachedUsers, setCachedUsers] = useState<User[]>([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 on search/filter/pageSize change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, pageSize]);

  const users = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cachedUsers.slice(start, start + pageSize);
  }, [cachedUsers, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalServerCount / pageSize)),
    [totalServerCount, pageSize],
  );

  const fetchUsers = useCallback(
    async (
      serverPage = 1,
      search = debouncedSearch,
      role = roleFilter,
      append = false,
    ) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(serverPage),
          limit: String(CACHE_LIMIT),
          ...(search ? { search } : {}),
          ...(role && role !== "all" ? { role } : {}),
        });

        const response = await fetch(`/api/users?${params}`);
        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();
        if (data.success) {
          setCachedUsers((prev) =>
            append ? [...prev, ...data.users] : data.users,
          );
          setTotalServerCount(data.pagination?.totalCount ?? data.users.length);
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
    },
    [debouncedSearch, roleFilter],
  );

  // Re-fetch when search or role filter changes
  useEffect(() => {
    fetchUsers(1, debouncedSearch, roleFilter, false);
  }, [debouncedSearch, roleFilter]);

  // Append next batch when user pages beyond cache
  useEffect(() => {
    const cachedEnd = cachedUsers.length;
    const neededEnd = page * pageSize;
    if (neededEnd > cachedEnd && cachedEnd < totalServerCount) {
      const serverPage = Math.floor(cachedEnd / CACHE_LIMIT) + 1;
      fetchUsers(serverPage, debouncedSearch, roleFilter, true);
    }
  }, [page, pageSize]);

  const stats = {
    total: totalServerCount,
    therapists: cachedUsers.filter((u) => u.role === UserRole.THERAPIST).length,
    admins: cachedUsers.filter((u) => u.role === UserRole.ADMIN).length,
    receptionists: cachedUsers.filter((u) => u.role === UserRole.RECEPTIONIST)
      .length,
    content_managers: cachedUsers.filter(
      (u) => u.role === UserRole.CONTENT_MANAGER,
    ).length,
    active: cachedUsers.filter((u) => u.status === UserStatus.ACTIVE).length,
    support: cachedUsers.filter(
      (u) =>
        u.role === UserRole.RECEPTIONIST || u.role === UserRole.CONTENT_MANAGER,
    ).length,
  };

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Employee Management
            </h2>
          </div>
          <AddEmployeeDialog
            onUserCreated={() =>
              fetchUsers(1, debouncedSearch, roleFilter, false)
            }
          />
        </div>

        {/* Stats */}
        <EmployeeStats stats={stats} />

        {/* Search + filter toolbar */}
        <div className="flex items-center justify-end gap-3 mb-4 mt-6">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 h-9 text-sm bg-white border-gray-200">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {AllRoles.map((role) => (
                <SelectItem key={role} value={role}>
                  {UserRoleLabel[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            <Input
              placeholder="Search by name, email, or phone..."
              className="bg-white pl-9 pr-8 w-72 border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <EmployeeTable
          users={users}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalServerCount}
          setPage={setPage}
          setPageSize={setPageSize}
          onUserUpdated={() =>
            fetchUsers(1, debouncedSearch, roleFilter, false)
          }
        />
      </div>
    </DashboardLayout>
  );
}

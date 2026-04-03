"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/use-toast";
import { AppointmentHeader } from "@/components/appointment-header";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { ScheduleNewDialog } from "@/components/appointments/schedule-new-appointment";
import { CalendarViewDialog } from "@/components/calendar-view-dialog";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { Appointment } from "@/types/appointments";
import { ServiceCategory } from "@/lib/generated/serviceEnums";

const CACHE_LIMIT = 100;

const mergeAppointmentsById = (
  existing: Appointment[],
  incoming: Appointment[],
) => {
  const merged = new Map<string, Appointment>();

  for (const appointment of existing) {
    merged.set(appointment.id, appointment);
  }

  for (const appointment of incoming) {
    merged.set(appointment.id, appointment);
  }

  return Array.from(merged.values()).sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const AppointmentPage = () => {
  const { user } = useAuth();

  const [cachedAppointments, setCachedAppointments] = useState<Appointment[]>([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  type TherapyTypeFilter = ServiceCategory | "all";
  const [therapyTypeFilter, setTherapyTypeFilter] = useState<TherapyTypeFilter>("all");

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // Slice cache for current page
  const appointments = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cachedAppointments.slice(start, start + pageSize);
  }, [cachedAppointments, page, pageSize]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalServerCount / pageSize)),
    [totalServerCount, pageSize]
  );

  const fetchAppointments = useCallback(
    async (serverPage = 1, search = debouncedSearch, append = false) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(serverPage),
          limit: String(CACHE_LIMIT),
          ...(search ? { search } : {}),
          ...(user?.role === UserRole.THERAPIST && user.id
            ? { therapistId: user.id }
            : {}),
        });

        const response = await fetch(`/api/appointments?${params}`);
        if (!response.ok) throw new Error("Failed to fetch appointments");

        const data = await response.json();
        if (data.success) {
          setCachedAppointments((prev) =>
            append
              ? mergeAppointmentsById(prev, data.appointments)
              : mergeAppointmentsById([], data.appointments)
          );
          setTotalServerCount(data.pagination?.totalCount ?? data.appointments.length);
        }
      } catch (error) {
        console.error("Error fetching appointments:", error);
        toast({
          title: "Error",
          description: "Failed to fetch appointments. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, user]
  );

  // Re-fetch (replace cache) when search changes
  useEffect(() => {
    fetchAppointments(1, debouncedSearch, false);
  }, [debouncedSearch]);

  // Append next batch when user pages beyond cached records
  useEffect(() => {
    const cachedEnd = cachedAppointments.length;
    const neededEnd = page * pageSize;
    if (neededEnd > cachedEnd && cachedEnd < totalServerCount) {
      const serverPage = Math.floor(cachedEnd / CACHE_LIMIT) + 1;
      fetchAppointments(serverPage, debouncedSearch, true);
    }
  }, [page, pageSize]);

  const handleAppointmentUpdated = () => {
    fetchAppointments(1, debouncedSearch, false);
  };

  return (
    <DashboardLayout>
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        <AppointmentHeader
          onScheduleNew={() => setScheduleDialogOpen(true)}
          onManageAppointments={() => {}}
          onViewCalendar={() => setCalendarDialogOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          appointments={appointments}
          therapyTypeFilter={therapyTypeFilter}
          setTherapyTypeFilter={setTherapyTypeFilter}
        />

        <AppointmentTable
          appointments={appointments}
          loading={loading}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalServerCount}
          therapyTypeFilter={therapyTypeFilter}
          setTherapyTypeFilter={setTherapyTypeFilter}
          setPage={setPage}
          setPageSize={setPageSize}
          onAppointmentUpdated={handleAppointmentUpdated}
        />

        <ScheduleNewDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          onAppointmentCreated={handleAppointmentUpdated}
        />

        <CalendarViewDialog
          open={calendarDialogOpen}
          onOpenChange={setCalendarDialogOpen}
          appointments={cachedAppointments}
        />
      </div>
    </DashboardLayout>
  );
};

export default AppointmentPage;

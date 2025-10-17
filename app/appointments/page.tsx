"use client";

import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "@/components/ui/use-toast";

import { AppointmentHeader } from "@/components/appointment-header";
import { AppointmentTable } from "@/components/appointments/appointment-table";
import { ScheduleNewDialog } from "@/components/appointments/schedule-new-appointment";
import { CalendarViewDialog } from "@/components/calendar-view-dialog";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { Appointment } from "@/types/appointments";
import { PaginationDefaultValue, PaginationInfo } from "@/types/index";
import { ServiceCategory } from "@/lib/generated/serviceEnums";

const AppointmentPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>(
    PaginationDefaultValue
  );
  type TherapyTypeFilter = ServiceCategory | "all";
  const [therapyTypeFilter, setTherapyTypeFilter] =
    useState<TherapyTypeFilter>("all");

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const { user } = useAuth();

  const fetchAppointments = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(search && { search }),
        ...(user?.role === UserRole.THERAPIST && { therapistId: user.id }),
      });

      const response = await fetch(`/api/appointments?${params}`);

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();

      if (data.success) {
        setAppointments(data.appointments);
        setPagination(data.pagination);
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
  };

  // Initial load
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAppointments(1, searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    fetchAppointments(newPage, searchQuery);
  };

  // Handle successful appointment creation/update
  const handleAppointmentUpdated = () => {
    fetchAppointments(pagination.currentPage, searchQuery);
  };

  return (
    <DashboardLayout>
      <div className="bg-gray-200 rounded-lg p-6 mb-8">
        {/* Header with action buttons */}
        <AppointmentHeader
          onScheduleNew={() => setScheduleDialogOpen(true)}
          onManageAppointments={() => setManageDialogOpen(true)}
          onViewCalendar={() => setCalendarDialogOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          appointments={appointments}
          therapyTypeFilter={therapyTypeFilter}
          setTherapyTypeFilter={setTherapyTypeFilter}
        />

        {/* Appointments Table */}
        <AppointmentTable
          appointments={appointments}
          loading={loading}
          pagination={pagination}
          therapyTypeFilter={therapyTypeFilter}
          setTherapyTypeFilter={setTherapyTypeFilter}
          onPageChange={handlePageChange}
          onAppointmentUpdated={handleAppointmentUpdated}
        />

        {/* Schedule New Appointment Dialog */}
        <ScheduleNewDialog
          open={scheduleDialogOpen}
          onOpenChange={setScheduleDialogOpen}
          onAppointmentCreated={handleAppointmentUpdated}
        />

        {/* Calendar View Dialog */}
        <CalendarViewDialog
          open={calendarDialogOpen}
          onOpenChange={setCalendarDialogOpen}
          appointments={appointments}
        />
      </div>
    </DashboardLayout>
  );
};

export default AppointmentPage;

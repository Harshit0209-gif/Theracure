"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Users,
  Calendar,
  CheckCircle,
  Clock,
  Activity,
  RefreshCw,
  UserCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTherapistDashboardData } from "@/hooks/use-therapist-dashboard-data";
import { StatsCard } from "@/components/stats/stats-section";
import { statusStyles, statusLabels } from "@/lib/appointment";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { formatTimeToIST, getGreeting } from "@/lib/utils/utils";
import { TodayAppointment } from "@/types/appointments";

interface AssignedPatient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  condition: string;
  lastVisit: string | null;
  nextAppointment: string | null;
  status: AppointmentStatus;
  assignmentId: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

const patientStatusStyles: Partial<Record<AppointmentStatus, string>> = {
  [AppointmentStatus.CONFIRMED]: "bg-blue-50 text-blue-700",
  [AppointmentStatus.COMPLETED]: "bg-emerald-50 text-emerald-700",
  [AppointmentStatus.CANCELLED]: "bg-red-50 text-red-600",
  [AppointmentStatus.RESCHEDULED]: "bg-amber-50 text-amber-700",
};

// Compact appointment row card — better for dashboard than a full table
const AppointmentItem: React.FC<{ appt: TodayAppointment; index: number }> = ({
  appt,
  index,
}) => {
  const style = statusStyles[appt.status];
  const label = statusLabels[appt.status] ?? appt.status;

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
      } border-b border-gray-100 last:border-0`}
    >
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
          <UserCircle2 className="h-4 w-4 text-indigo-600" />
        </div>
        <span className="font-medium text-sm text-gray-800">
          {appt.patientName}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {appt.time ? formatTimeToIST(appt.time) : "—"}
        </span>
        {style && label ? (
          <span
            className={`text-xs px-2 py-1 rounded-md inline-block ${style}`}
          >
            {label}
          </span>
        ) : (
          <span className="text-xs px-2 py-1 rounded-md inline-block bg-gray-50 text-gray-600">
            {appt.status}
          </span>
        )}
      </div>
    </div>
  );
};

const patientColumns = [
  {
    header: "Patient Name",
    cell: (row: AssignedPatient) => (
      <span className="font-medium">{row.patientName}</span>
    ),
  },
  {
    header: "Age",
    cell: (row: AssignedPatient) => row.age ?? "—",
    headerClassName: "w-16",
    cellClassName: "w-16",
  },
  {
    header: "Condition",
    cell: (row: AssignedPatient) => (
      <span className="text-gray-600 text-sm">{row.condition}</span>
    ),
  },
  {
    header: "Last Visit",
    cell: (row: AssignedPatient) => formatDate(row.lastVisit),
  },
  {
    header: "Next Appointment",
    cell: (row: AssignedPatient) => formatDate(row.nextAppointment),
  },
  {
    header: "Status",
    cell: (row: AssignedPatient) => {
      const style =
        patientStatusStyles[row.status] ?? "bg-gray-50 text-gray-700";
      const label =
        statusLabels[row.status] ??
        row.status.charAt(0).toUpperCase() + row.status.slice(1).toLowerCase();
      return (
        <span
          className={`text-xs px-2 py-1 rounded-md inline-block ${style}`}
        >
          {label}
        </span>
      );
    },
  },
];

export default function TherapistDashboard() {
  const { user } = useAuth();
  const {
    stats,
    assignedPatients,
    todayAppointments,
    isLoading,
    error,
    lastUpdated,
    refreshAll,
  } = useTherapistDashboardData();

  const patients: AssignedPatient[] = (assignedPatients || []) as unknown as AssignedPatient[];
  const appointments: TodayAppointment[] = todayAppointments || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {getGreeting()}, {user?.name?.split(" ")[0] || "Therapist"}!
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "Asia/Kolkata",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-gray-600">Live Updates</span>
            </div>
            <Button
              onClick={refreshAll}
              variant="outline"
              size="sm"
              disabled={isLoading.refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading.refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Assigned Patients"
            value={stats?.assignedPatients || 0}
            subtitle={<p className="text-xs text-blue-500 mt-1">Active cases</p>}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
          <StatsCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            subtitle={
              <p className="text-xs text-purple-500 mt-1">Scheduled today</p>
            }
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
          <StatsCard
            title="Completed Sessions"
            value={stats?.completedSessions || 0}
            subtitle={<p className="text-xs text-green-500 mt-1">All time</p>}
            icon={<CheckCircle className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
          <StatsCard
            title="Pending Sessions"
            value={stats?.pendingSessions || 0}
            subtitle={
              <p className="text-xs text-orange-500 mt-1">
                Awaiting completion
              </p>
            }
            icon={<Clock className="h-6 w-6 text-orange-600" />}
            bgColor="bg-orange-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
        </div>

        {/* Two-column row: Today's Appointments + quick stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments — compact list */}
          <Card className="bg-white shadow-sm lg:col-span-2">
            <CardHeader className="pb-2 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  Today&apos;s Appointments
                </CardTitle>
                <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                  {appointments.length} scheduled
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading.today ? (
                <div className="space-y-0">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 border-b border-gray-100 animate-pulse"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200" />
                        <div className="h-3 w-32 bg-gray-200 rounded" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 w-16 bg-gray-200 rounded" />
                        <div className="h-5 w-20 bg-gray-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error.today ? (
                <div className="py-8 text-center text-sm text-red-500">
                  Failed to load appointments
                </div>
              ) : appointments.length === 0 ? (
                <div className="py-12 text-center">
                  <Calendar className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    No appointments scheduled for today
                  </p>
                </div>
              ) : (
                appointments.map((appt, i) => (
                  <AppointmentItem key={appt.id} appt={appt} index={i} />
                ))
              )}
            </CardContent>
          </Card>

          {/* Session summary sidebar */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-2 border-b border-gray-100">
              <CardTitle className="text-base font-semibold">
                Session Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                {
                  label: "This Month",
                  value: stats?.thisMonthSessions ?? 0,
                  color: "bg-indigo-100 text-indigo-700",
                  loading: isLoading.stats,
                },
                {
                  label: "Completed",
                  value: stats?.completedSessions ?? 0,
                  color: "bg-emerald-100 text-emerald-700",
                  loading: isLoading.stats,
                },
                {
                  label: "Pending",
                  value: stats?.pendingSessions ?? 0,
                  color: "bg-orange-100 text-orange-700",
                  loading: isLoading.stats,
                },
              ].map(({ label, value, color, loading }) => (
                <div
                  key={label}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-sm text-gray-600">{label}</span>
                  {loading ? (
                    <div className="h-6 w-8 bg-gray-200 rounded animate-pulse" />
                  ) : (
                    <span
                      className={`text-sm font-semibold px-2 py-0.5 rounded ${color}`}
                    >
                      {value.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Assigned Patients — full DataTable */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">
              Assigned Patients
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={patientColumns}
              data={patients}
              rowKey={(row) => row.assignmentId}
              page={1}
              pageSize={patients.length || 10}
              totalPages={1}
              totalCount={patients.length}
              setPage={() => {}}
              setPageSize={() => {}}
              loading={isLoading.patients}
              countIcon={<Activity className="h-4 w-4" />}
              countLabel="patients"
              emptyIcon={<Users className="h-12 w-12" />}
              emptyTitle="No patients assigned"
              emptyDescription="You have no assigned patients at the moment"
            />
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Last updated:{" "}
          {lastUpdated
            ? lastUpdated.toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })
            : "Never"}
        </p>
      </div>
    </DashboardLayout>
  );
}

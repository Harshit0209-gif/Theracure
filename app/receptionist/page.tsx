"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  RefreshCw,
  Calendar,
  Users,
  Handshake,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  IndianRupee,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { useReceptionistDashboardData } from "@/hooks/use-receptionist-dashboard-data";
import {
  formatCurrency,
  formatTimeToIST,
  getGreeting,
} from "@/lib/utils/utils";
import { StatsCard } from "@/components/stats/stats-section";
import { statusStyles, statusLabels } from "@/lib/appointment";
import { TodayAppointment } from "@/types/appointments";

const formatGrowthPercentage = (
  percentage: number,
  isPositive: boolean,
): React.ReactNode => {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? "text-green-500" : "text-red-500";
  const prefix = isPositive ? "↑" : "↓";

  return (
    <p className={`text-xs ${color} mt-1 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {prefix} {Math.abs(percentage).toFixed(1)}% from last month
    </p>
  );
};

const appointmentColumns = [
  {
    header: "Patient's Name",
    cell: (row: TodayAppointment) => (
      <span className="font-medium">{row.patientName}</span>
    ),
  },
  {
    header: "Assigned Therapist",
    cell: (row: TodayAppointment) => row.therapistName,
  },
  {
    header: "Time",
    cell: (row: TodayAppointment) =>
      row.time ? formatTimeToIST(row.time) : "—",
  },
  {
    header: "Status",
    cell: (row: TodayAppointment) => {
      const style = statusStyles[row.status];
      const label = statusLabels[row.status];
      return (
        <span
          className={`text-xs px-2 py-1 rounded-md inline-block ${style ?? "bg-gray-50 text-gray-700"}`}
        >
          {label ?? row.status}
        </span>
      );
    },
  },
];

export default function ReceptionistDashboard() {
  const { user } = useAuth();
  const {
    todayAppointments,
    receptionistStats,
    isLoading,
    error,
    lastUpdated,
    refreshAll,
  } = useReceptionistDashboardData();

  const appointments: TodayAppointment[] = todayAppointments || [];

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {getGreeting()}, {user?.name?.split(" ")[0] || "User"}!
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
                className={`h-4 w-4 mr-2 ${
                  isLoading.refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Patients"
            value={receptionistStats?.totalPatients.count || 0}
            subtitle={
              receptionistStats
                ? formatGrowthPercentage(
                    receptionistStats.totalPatients.growthPercentage,
                    receptionistStats.totalPatients.isGrowthPositive,
                  )
                : "Loading..."
            }
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Today's Consultations"
            value={receptionistStats?.todayConsultations.total || 0}
            subtitle={
              receptionistStats ? (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-gray-500">
                    <span className="font-medium text-gray-700">
                      {receptionistStats.todayConsultations.thisWeek}
                    </span>{" "}
                    this week
                  </p>
                  <p className={`text-xs flex items-center gap-1 ${receptionistStats.todayConsultations.isWeekGrowthPositive ? "text-green-500" : "text-red-500"}`}>
                    {receptionistStats.todayConsultations.isWeekGrowthPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {receptionistStats.todayConsultations.isWeekGrowthPositive ? "↑" : "↓"}{" "}
                    {Math.abs(receptionistStats.todayConsultations.weekGrowthPercentage).toFixed(1)}% vs last week
                  </p>
                </div>
              ) : "Loading..."
            }
            icon={<Handshake className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Completed Today"
            value={receptionistStats?.todaySessions.total || 0}
            subtitle={
              <p className="text-xs text-blue-500 mt-1">
                {receptionistStats?.todaySessions.pending || 0} still pending
              </p>
            }
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Pending Payments"
            value={
              receptionistStats
                ? formatCurrency(receptionistStats.pendingPayments.amount)
                : "₹0"
            }
            subtitle={
              <p className="text-xs text-red-500 mt-1">
                {receptionistStats?.pendingPayments.invoiceCount || 0} invoices
                pending
              </p>
            }
            icon={<IndianRupee className="h-6 w-6 text-orange-600" />}
            bgColor="bg-orange-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
        </div>

        {/* Today's Appointments */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Appointments Today
            </CardTitle>
            <Link href="/appointments">
              <Button variant="outline" size="sm" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5">
                View All
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={appointmentColumns}
              data={appointments}
              rowKey={(row) => row.id}
              page={1}
              pageSize={appointments.length || 10}
              totalPages={1}
              totalCount={appointments.length}
              setPage={() => {}}
              setPageSize={() => {}}
              loading={isLoading.appointments}
              hidePageSizeSelector
              hidePaginationFooter
              countIcon={<CalendarClock className="h-4 w-4" />}
              countLabel="appointments today"
              emptyIcon={<CalendarClock className="h-12 w-12" />}
              emptyTitle="No appointments today"
              emptyDescription="No appointments are scheduled for today"
            />
          </CardContent>
        </Card>

        {/* Status Footer */}
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

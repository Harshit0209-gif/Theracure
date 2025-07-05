"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Calendar,
  UserCheck,
  UserX,
  CheckCircle2,
  Clock4,
  Handshake,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";
import { useAdminDashboardData } from "@/hooks/use-admin-dashboard-data";
import { useAuth } from "@/contexts/auth-context";
import { formatCurrency, getGreeting } from "@/lib/utils/utils";
import { StatsCard } from "@/components/stats/stats-section";

interface PatientStatusItemProps {
  title: string;
  subtitle: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}

interface TherapistStatusItemProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
}

interface TodayAppointment {
  id: string;
  patientName: string;
  therapistName: string;
  time: string;
  status: "confirmed" | "completed" | "cancelled" | "in-progress" | "pending";
}

const formatGrowthPercentage = (
  percentage: number,
  isPositive: boolean,
  label = "from last month"
): React.ReactNode => {
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const color = isPositive ? "text-green-500" : "text-red-500";
  const prefix = isPositive ? "↑" : "↓";

  return (
    <p className={`text-xs ${color} mt-1 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {prefix} {Math.abs(percentage).toFixed(1)}% {label}
    </p>
  );
};

const getStatusConfig = (status: string) => {
  const configs = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    "in-progress": "bg-blue-100 text-blue-700",
    completed: "bg-gray-100 text-gray-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return configs[status as keyof typeof configs] || "bg-gray-100 text-gray-700";
};

const PatientStatusItem: React.FC<PatientStatusItemProps> = ({
  title,
  subtitle,
  value,
  icon,
  bgColor,
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <div
        className={`h-10 w-10 ${bgColor} rounded-full flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
    <span className="text-lg font-semibold">
      {typeof value === "number" ? value.toLocaleString("en-IN") : value}
    </span>
  </div>
);

const TherapistStatusItem: React.FC<TherapistStatusItemProps> = ({
  title,
  value,
  icon,
  bgColor,
}) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center space-x-3">
      <div
        className={`h-10 w-10 ${bgColor} rounded-full flex items-center justify-center`}
      >
        {icon}
      </div>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-2xl font-bold mt-1">
          {typeof value === "number" ? value.toLocaleString("en-IN") : value}
        </p>
      </div>
    </div>
  </div>
);

const LoadingTable: React.FC = () => (
  <div className="space-y-4">
    <div className="animate-pulse">
      <div className="h-32 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const ErrorTable: React.FC<{ message: string }> = ({ message }) => (
  <div className="text-center py-8">
    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
    <p className="text-red-600">{message}</p>
  </div>
);

const AppointmentsTable: React.FC<{
  appointments: TodayAppointment[];
  isLoading: boolean;
  error: boolean;
}> = ({ appointments, isLoading, error }) => {
  if (isLoading) return <LoadingTable />;
  if (error)
    return <ErrorTable message="Failed to load today's appointments" />;

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-indigo-700">
            <TableHead className="font-semibold text-white">Patient</TableHead>
            <TableHead className="font-semibold text-white">
              Therapist
            </TableHead>
            <TableHead className="font-semibold text-white">Time</TableHead>
            <TableHead className="font-semibold text-white">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments && appointments.length > 0 ? (
            appointments.slice(0, 3).map((appointment) => (
              <TableRow key={appointment.id}>
                <TableCell className="font-medium">
                  {appointment.patientName}
                </TableCell>
                <TableCell>{appointment.therapistName}</TableCell>
                <TableCell>{appointment.time}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${getStatusConfig(
                      appointment.status
                    )}`}
                  >
                    {appointment.status.charAt(0).toUpperCase() +
                      appointment.status.slice(1).replace("-", " ")}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                No appointments scheduled for today
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default function AdminDashboard() {
  const {
    patientStats,
    therapyStats,
    todayAppointments,
    revenueStatus: revenueStats,
    isLoading,
    error,
    lastUpdated,
    refreshAll,
  } = useAdminDashboardData();

  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header with Refresh */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {getGreeting()}, {user?.name || "User"}!
            </h1>
            <p className="text-sm text-gray-600">
              Real-time clinic management overview
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Patients"
            value={patientStats?.totalPatients.count || 0}
            subtitle={
              patientStats
                ? formatGrowthPercentage(
                    patientStats.totalPatients.growthPercentage,
                    patientStats.totalPatients.isGrowthPositive
                  )
                : "Loading..."
            }
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
            isLoading={isLoading.patients}
            error={error.patients}
          />

          <StatsCard
            title="Monthly Revenue"
            value={
              revenueStats?.revenue
                ? formatCurrency(revenueStats.revenue.thisMonth)
                : "₹0"
            }
            subtitle={
              revenueStats?.revenue
                ? formatGrowthPercentage(
                    revenueStats.revenue.growthPercentage,
                    revenueStats.revenue.isGrowthPositive
                  )
                : "Loading..."
            }
            icon={<IndianRupee className="h-6 w-6 text-orange-600" />}
            bgColor="bg-orange-100"
            isLoading={isLoading.revenue}
            error={error.revenue}
          />
          <StatsCard
            title="Today's Consultations"
            value={therapyStats?.todayConsultations.total || 0}
            subtitle={
              <p className="text-xs text-green-500 mt-1">
                {therapyStats?.todayConsultations.completed || 0} completed,{" "}
                {therapyStats?.todayConsultations.pending || 0} pending
              </p>
            }
            icon={<Handshake className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            isLoading={isLoading.therapy}
            error={error.therapy}
          />

          <StatsCard
            title="Today's Sessions"
            value={therapyStats?.todaySessions.total || 0}
            subtitle={
              <p className="text-xs text-blue-500 mt-1">
                {therapyStats?.todaySessions.pending || 0} pending
              </p>
            }
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
            isLoading={isLoading.therapy}
            error={error.therapy}
          />
        </div>

        {/* Patient Status and Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Status */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">
                Patient Status
              </CardTitle>
              <Link href="/patients">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {isLoading.patients ? (
                <div className="space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div>
                            <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                            <div className="h-3 bg-gray-200 rounded w-32"></div>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error.patients ? (
                <ErrorTable message="Failed to load patient status" />
              ) : (
                <div className="space-y-4">
                  <PatientStatusItem
                    title="Active Patients"
                    subtitle={
                      patientStats?.activePatients.description ||
                      "Currently in treatment"
                    }
                    value={patientStats?.activePatients.count || 0}
                    icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
                    bgColor="bg-green-100"
                  />

                  <PatientStatusItem
                    title="Pending Follow-ups"
                    subtitle={
                      patientStats?.pendingFollowUps.period ||
                      "Scheduled for next week"
                    }
                    value={patientStats?.pendingFollowUps.count || 0}
                    icon={<Clock4 className="h-5 w-5 text-blue-600" />}
                    bgColor="bg-blue-100"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Consultations */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">
                Today's Consultations
              </CardTitle>
              <Link href="/consultations">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <AppointmentsTable
                appointments={todayAppointments || []}
                isLoading={isLoading.appointments}
                error={error.appointments}
              />
            </CardContent>
          </Card>
        </div>

        {/* Therapist Status */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Therapist Status
            </CardTitle>
            <Link href="/employees">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {isLoading.therapy ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                          <div className="h-6 bg-gray-200 rounded w-8"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error.therapy ? (
              <ErrorTable message="Failed to load therapist status" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <TherapistStatusItem
                  title="Total Therapists"
                  value={therapyStats?.therapistStatus.total || 0}
                  icon={<Users className="h-5 w-5 text-blue-600" />}
                  bgColor="bg-blue-100"
                />

                <TherapistStatusItem
                  title="Active"
                  value={therapyStats?.therapistStatus.active || 0}
                  icon={<UserCheck className="h-5 w-5 text-green-600" />}
                  bgColor="bg-green-100"
                />

                <TherapistStatusItem
                  title="Off Duty"
                  value={therapyStats?.therapistStatus.offDuty || 0}
                  icon={<UserX className="h-5 w-5 text-red-600" />}
                  bgColor="bg-red-100"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Footer */}
        <div className="text-center text-xs text-gray-500">
          Last updated:{" "}
          {lastUpdated ? lastUpdated.toLocaleString("en-IN") : "Never"}
        </div>
      </div>
    </DashboardLayout>
  );
}

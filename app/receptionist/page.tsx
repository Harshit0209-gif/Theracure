// ====================================================================
// RECEPTIONIST DASHBOARD COMPONENT
// ====================================================================
// File: app/dashboard/receptionist/page.tsx

"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Handshake,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { useReceptionistDashboardData } from "@/hooks/use-receptionist-dashboard-data";

// ====================================================================
// TYPES
// ====================================================================
interface TodayAppointment {
  id: string;
  patientName: string;
  therapistName: string;
  startTime: string;
  endTime: string;
  status:
    | "scheduled"
    | "confirmed"
    | "in-progress"
    | "completed"
    | "cancelled"
    | "no-show";
  patientId: string;
  therapistId: string;
  appointmentDuration: number;
}

interface ReceptionistStats {
  totalPatients: {
    count: number;
    growthPercentage: number;
    isGrowthPositive: boolean;
  };
  todayConsultations: {
    total: number;
    newThisWeek: number;
  };
  todaySessions: {
    total: number;
    pending: number;
  };
  pendingPayments: {
    amount: number;
    invoiceCount: number;
  };
  todayAppointments: number;
  completedToday: number;
  pendingToday: number;
  cancelledToday: number;
  totalPatientsToday: number;
}

// ====================================================================
// UTILITY FUNCTIONS
// ====================================================================
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatGrowthPercentage = (
  percentage: number,
  isPositive: boolean
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

const formatDateTime = (dateTimeString: string): string => {
  return new Date(dateTimeString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getStatusConfig = (status: string) => {
  const configs = {
    scheduled: { bg: "bg-blue-100", text: "text-blue-700", label: "Scheduled" },
    confirmed: {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "Confirmed",
    },
    "in-progress": {
      bg: "bg-yellow-100",
      text: "text-yellow-700",
      label: "In Progress",
    },
    completed: { bg: "bg-gray-100", text: "text-gray-700", label: "Completed" },
    cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
    "no-show": {
      bg: "bg-orange-100",
      text: "text-orange-700",
      label: "No Show",
    },
  };
  return configs[status as keyof typeof configs] || configs.scheduled;
};

// ====================================================================
// COMPONENTS
// ====================================================================
const StatsCard: React.FC<{
  title: string;
  value: string | number;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  bgColor: string;
  isLoading?: boolean;
  error?: boolean;
}> = ({
  title,
  value,
  subtitle,
  icon,
  bgColor,
  isLoading = false,
  error = false,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-500">{title}</p>
              <h3 className="text-2xl font-bold mt-1 text-red-700">--</h3>
              <p className="text-xs text-red-500 mt-1">Error loading data</p>
            </div>
            <div
              className={`h-12 w-12 ${bgColor} rounded-full flex items-center justify-center opacity-50`}
            >
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {typeof value === "number"
                ? value.toLocaleString("en-IN")
                : value}
            </h3>
            <div className="mt-1">{subtitle}</div>
          </div>
          <div
            className={`h-12 w-12 ${bgColor} rounded-full flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingTable: React.FC = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="flex items-center space-x-4 p-4">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-6 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

const ErrorTable: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="text-center py-8">
    <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
    <p className="text-red-600 mb-4">{message}</p>
    <Button onClick={onRetry} variant="outline" size="sm">
      <RefreshCw className="h-4 w-4 mr-2" />
      Retry
    </Button>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const config = getStatusConfig(status);
  return (
    <Badge className={`${config.bg} ${config.text} hover:${config.bg}`}>
      {config.label}
    </Badge>
  );
};

const AppointmentsTable: React.FC<{
  appointments: TodayAppointment[];
  isLoading: boolean;
  error: boolean;
  onRetry: () => void;
}> = ({ appointments, isLoading, error, onRetry }) => {
  if (isLoading) return <LoadingTable />;
  if (error)
    return (
      <ErrorTable
        message="Failed to load today's appointments"
        onRetry={onRetry}
      />
    );

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow className="bg-indigo-700">
            <TableHead className="font-semibold text-white">
              Patient's Name
            </TableHead>
            <TableHead className="font-semibold text-white">
              Assigned Therapist
            </TableHead>
            <TableHead className="font-semibold text-white">Time</TableHead>
            <TableHead className="font-semibold text-white">
              Tentative Exit Time
            </TableHead>
            <TableHead className="font-semibold text-white">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments && appointments.length > 0 ? (
            appointments.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-gray-50">
                <TableCell className="font-medium">
                  {appointment.patientName}
                </TableCell>
                <TableCell>{appointment.therapistName}</TableCell>
                <TableCell>{formatDateTime(appointment.startTime)}</TableCell>
                <TableCell>{formatDateTime(appointment.endTime)}</TableCell>
                <TableCell>
                  <StatusBadge status={appointment.status} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No appointments scheduled for today
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

// ====================================================================
// MAIN COMPONENT
// ====================================================================
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {getGreeting()}, {user?.name || "User"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Receptionist Dashboard -{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Patients"
            value={receptionistStats?.totalPatients.count || 0}
            subtitle={
              receptionistStats
                ? formatGrowthPercentage(
                    receptionistStats.totalPatients.growthPercentage,
                    receptionistStats.totalPatients.isGrowthPositive
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
              <p className="text-xs text-green-500 mt-1">
                ↑ {receptionistStats?.todayConsultations.newThisWeek || 0} new
                this week
              </p>
            }
            icon={<Handshake className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Today's Sessions"
            value={receptionistStats?.todaySessions.total || 0}
            subtitle={
              <p className="text-xs text-blue-500 mt-1">
                {receptionistStats?.todaySessions.pending || 0} pending
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
                {receptionistStats?.pendingPayments.invoiceCount || 0} Invoices
                pending completion
              </p>
            }
            icon={<DollarSign className="h-6 w-6 text-orange-600" />}
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
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-indigo-600">
                {todayAppointments?.length || 0} appointments
              </Badge>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <AppointmentsTable
              appointments={todayAppointments || []}
              isLoading={isLoading.appointments}
              error={error.appointments}
              onRetry={refreshAll}
            />
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

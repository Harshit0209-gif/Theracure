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
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  FileText,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useTherapistDashboardData } from "@/hooks/use-therapist-dashboard-data";
import Link from "next/link";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor: string;
  isLoading?: boolean;
  error?: boolean;
}

interface AssignedPatient {
  id: string;
  patientId: string;
  patientName: string;
  age: number;
  condition: string;
  lastVisit: string | null;
  nextAppointment: string | null;
  status: "confirmed" | "pending" | "completed" | "cancelled";
  assignmentId: string;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return "Not scheduled";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getStatusConfig = (status: string) => {
  const configs = {
    confirmed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return configs[status as keyof typeof configs] || "bg-gray-100 text-gray-700";
};

const getStatusLabel = (status: string): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
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
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
          <div className="h-4 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
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

const AssignedPatientsTable: React.FC<{
  patients: AssignedPatient[];
  isLoading: boolean;
  error: boolean;
  onRetry: () => void;
}> = ({ patients, isLoading, error, onRetry }) => {
  if (isLoading) return <LoadingTable />;
  if (error)
    return (
      <ErrorTable
        message="Failed to load assigned patients data"
        onRetry={onRetry}
      />
    );

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-indigo-700">
          <TableHead className="font-semibold text-white">
            Patient Name
          </TableHead>
          <TableHead className="font-semibold text-white">Age</TableHead>
          <TableHead className="font-semibold text-white">Condition</TableHead>
          <TableHead className="font-semibold text-white">Last Visit</TableHead>
          <TableHead className="font-semibold text-white">
            Next Appointment
          </TableHead>
          <TableHead className="font-semibold text-white">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients && patients.length > 0 ? (
          patients.map((patient) => (
            <TableRow key={patient.assignmentId} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {patient.patientName}
              </TableCell>
              <TableCell>{patient.age}</TableCell>
              <TableCell>{patient.condition}</TableCell>
              <TableCell>{formatDate(patient.lastVisit)}</TableCell>
              <TableCell>{formatDate(patient.nextAppointment)}</TableCell>
              <TableCell>
                <Badge className={getStatusConfig(patient.status)}>
                  {getStatusLabel(patient.status)}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              No assigned patients found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default function TherapistDashboard() {
  const { user } = useAuth();
  const { stats, assignedPatients, isLoading, error, lastUpdated, refreshAll } =
    useTherapistDashboardData();

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              Welcome, {user?.name || "Therapist"}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Your personalized therapy dashboard
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatsCard
            title="Assigned Patients"
            value={stats?.assignedPatients || 0}
            icon={<Users className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Today's Appointments"
            value={stats?.todayAppointments || 0}
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />

          <StatsCard
            title="Completed Sessions"
            value={stats?.completedSessions || 0}
            icon={<FileText className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            isLoading={isLoading.stats}
            error={error.stats}
          />
        </div>

        {/* Assigned Patients */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">
              Assigned Patients
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-blue-600">
                {assignedPatients?.length || 0} patients
              </Badge>
              <Link href="/appointments" className="ml-auto">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <AssignedPatientsTable
              patients={assignedPatients || []}
              isLoading={isLoading.patients}
              error={error.patients}
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

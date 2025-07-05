import { UserRole } from "@prisma/client";
import { useEffect, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Key,
  Mail,
  Phone,
  Shield,
  UserIcon,
} from "lucide-react";
import { RoleOptionsMap } from "@/lib/userRoles";

interface EmployeeProfileCardProps {
  user: User;
}

interface TherapistStats {
  assignedPatients: number;
  todayAppointments: number;
  completedSessions: number;
}

export function EmployeeProfileCard({ user }: EmployeeProfileCardProps) {
  const [stats, setStats] = useState<TherapistStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (user.role !== UserRole.THERAPIST) return;

      try {
        setLoadingStats(true);
        const res = await fetch(`/api/therapists/${user.id}/stats`);
        if (!res.ok) {
          throw new Error("Failed to fetch therapist stats");
        }
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user.id, user.role]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg capitalize">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900 capitalize">
              {user.name}
            </h2>
            {(() => {
              const IconComponent = RoleOptionsMap[user.role].icon;
              return (
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    RoleOptionsMap[user.role].color
                  }`}
                >
                  <IconComponent className="w-4 h-4 mr-1" />
                  {RoleOptionsMap[user.role].label}
                </div>
              );
            })()}
          </div>
          <div className="flex items-center space-x-3">
            <Badge
              variant={user.status === "active" ? "default" : "secondary"}
              className={
                user.status === "active"
                  ? "bg-green-100 text-green-800 px-4 py-2"
                  : "bg-gray-100 text-gray-800 px-4 py-2"
              }
            >
              {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">Full Name</p>
                <p className="text-gray-900 capitalize">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Email Address
                </p>
                <p className="text-gray-900">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Phone Number
                  </p>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Role Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Role & Permissions
          </h3>
          <div className={`p-4 rounded-lg ${RoleOptionsMap[user.role].color}`}>
            <h4 className="font-medium">{RoleOptionsMap[user.role].label}</h4>
            <p className="text-sm mt-1">
              {RoleOptionsMap[user.role].description}
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Account Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Calendar className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Account Created
                </p>
                <p className="text-gray-900">{formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Clock className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Last Updated
                </p>
                <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Key className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-500">User ID</p>
                <p className="text-gray-900 font-mono text-sm">{user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats (if user is therapist) */}
        {user.role === UserRole.THERAPIST && (
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Quick Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {loadingStats ? "..." : stats?.assignedPatients ?? 0}
                </p>
                <p className="text-sm text-blue-600">Assign Patients</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  {loadingStats ? "..." : stats?.todayAppointments ?? 0}
                </p>
                <p className="text-sm text-green-600">Today's Appointment</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">
                  {loadingStats ? "..." : stats?.completedSessions ?? 0}
                </p>
                <p className="text-sm text-amber-600">Completed Session</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

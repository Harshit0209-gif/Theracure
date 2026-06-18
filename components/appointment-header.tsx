"use client";

import { Button } from "@/components/ui/button";
import { CalendarDays, Plus } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";

interface AppointmentHeaderProps {
  onScheduleNew: () => void;
  onManageAppointments: () => void;
  onViewCalendar: () => void;
}

export function AppointmentHeader({
  onScheduleNew,
  onViewCalendar,
}: AppointmentHeaderProps) {
  const { user } = useAuth();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Appointment Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage patient appointments and schedules</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          onClick={onViewCalendar}
          variant="outline"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          View Calendar
        </Button>

        {user?.role !== UserRole.THERAPIST && (
          <Button
            onClick={onScheduleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule New
          </Button>
        )}
      </div>
    </div>
  );
}

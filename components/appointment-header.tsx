import { Button } from "@/components/ui/button";
import { CalendarCheck2, Plus, CalendarDays } from "lucide-react";
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
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold mb-1 text-gray-800">
          Appointment Management
        </h1>
        <p className="text-gray-600">
          Manage patient appointments and schedules
        </p>
      </div>

      <div className="flex gap-2 w-full md:w-auto justify-end">
        {user?.role != UserRole.THERAPIST ? (
          <Button
            onClick={onScheduleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Schedule New
          </Button>
        ) : null}
        <Button
          onClick={onViewCalendar}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
        >
          <CalendarDays className="h-5 w-5" />
          View Calendar
        </Button>
      </div>
    </div>
  );
}

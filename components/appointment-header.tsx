import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { useEffect } from "react";
import { Appointment } from "@/types/appointments";
import { AllServiceCatagory, ServiceCategoryLabel } from "@/lib/service";
import { ServiceCategory } from "@/lib/generated/serviceEnums";

interface AppointmentHeaderProps {
  onScheduleNew: () => void;
  onManageAppointments: () => void;
  onViewCalendar: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  appointments: Appointment[];
  therapyTypeFilter: string;
  setTherapyTypeFilter: (type: ServiceCategory) => void;
}

export function AppointmentHeader({
  onScheduleNew,
  onViewCalendar,
  searchQuery,
  setSearchQuery,
  appointments,
  therapyTypeFilter,
  setTherapyTypeFilter,
}: AppointmentHeaderProps) {
  const { user } = useAuth();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, setSearchQuery]);

  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Appointment Management</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage patient appointments and schedules</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-end">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            type="text"
            placeholder="Search by patient name..."
            className="bg-white pl-9 pr-8 w-64 border-gray-200 focus:border-indigo-400 rounded-lg shadow-sm text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Therapy filter */}
        <Select value={therapyTypeFilter} onValueChange={setTherapyTypeFilter}>
          <SelectTrigger className="w-44 bg-white border-gray-200 shadow-sm text-sm">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-gray-400" />
              <SelectValue placeholder="All therapies" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Therapies</SelectItem>
            {AllServiceCatagory.map((type) => (
              <SelectItem key={type} value={type}>
                {ServiceCategoryLabel[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {user?.role !== UserRole.THERAPIST && (
          <Button
            onClick={onScheduleNew}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Schedule New
          </Button>
        )}

        <Button
          onClick={onViewCalendar}
          variant="outline"
          className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 flex items-center gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          View Calendar
        </Button>
      </div>
    </div>
  );
}

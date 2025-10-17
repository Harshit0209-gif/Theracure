import { Button } from "@/components/ui/button";
import {
  CalendarCheck2,
  Plus,
  CalendarDays,
  Search,
  Filter,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { useEffect, useMemo, useState } from "react";
import { Appointment } from "@/types/appointments";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
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

  // Debounce search input
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, setSearchQuery]);

  const therapyTypes = useMemo(() => {
    const types = new Set<string>();
    appointments.forEach((appointment) => {
      if (appointment.service?.name) {
        types.add(appointment.service.name);
      }
    });
    return Array.from(types).sort();
  }, [appointments]);

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
        <div className="flex items-center">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by patient name"
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg w-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Therapy Type Filter */}
            <div className="relative w-full sm:w-48">
              <Select
                value={therapyTypeFilter}
                onValueChange={setTherapyTypeFilter}
              >
                <SelectTrigger className="bg-white border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-indigo-400" />
                    <SelectValue placeholder="Filter by therapy type" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select Therapy</SelectItem>
                  {AllServiceCatagory.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ServiceCategoryLabel[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
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

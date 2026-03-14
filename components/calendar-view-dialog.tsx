import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Appointment } from "@/types/appointments";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { statusLabels, statusStyles } from "@/lib/appointment";

interface CalendarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
}

export function CalendarViewDialog({
  open,
  onOpenChange,
  appointments = [],
}: CalendarViewDialogProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date: any) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const navigateMonth = (direction: any) => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  // Group appointments by date
  const appointmentsByDate = appointments.reduce((acc, appointment) => {
    // Use assignedDate if available, otherwise fall back to appointmentStartTime
    const rawDate =
      appointment.assignedDate || appointment.appointmentStartTime;

    if (!rawDate) {
      console.warn("⛔ Missing date field:", appointment);
      return acc;
    }

    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      console.warn("❌ Invalid date:", rawDate);
      return acc;
    }

    const dateKey = parsedDate.toISOString().split("T")[0];

    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(appointment);
    return acc;
  }, {} as Record<string, Appointment[]>);

  const formatDateKey = (day: any) => {
    if (!day) return "";
    const date = new Date(currentYear, currentMonth, day);
    return date.toISOString().split("T")[0];
  };

  const isToday = (day: any) => {
    if (!day) return false;
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const hasAppointment = (day: any) => {
    if (!day) return false;
    const dateKey = formatDateKey(day);
    return (
      appointmentsByDate[dateKey] && appointmentsByDate[dateKey].length > 0
    );
  };

  const getAppointmentCount = (day: any) => {
    if (!day) return 0;
    const dateKey = formatDateKey(day);
    return appointmentsByDate[dateKey]?.length || 0;
  };

  const getAppointmentStatus = (day: any) => {
    if (!day) return null;
    const dateKey = formatDateKey(day);
    const dayAppointments = appointmentsByDate[dateKey];
    if (!dayAppointments || dayAppointments.length === 0) return null;

    // If multiple appointments, show mixed status
    const statuses = dayAppointments.map((apt) => apt.status);
    const uniqueStatuses = [...new Set(statuses)];

    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0];
    }
    return "mixed";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const days = getDaysInMonth(currentDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Calendar
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-6">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <h2 className="text-lg font-medium text-gray-900">
              {months[currentMonth]} {currentYear}
            </h2>

            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="p-2 text-center">
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square p-1">
                {day && (
                  <div
                    className={`
                      w-full h-full flex flex-col items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all
                      ${
                        isToday(day)
                          ? "bg-blue-600 text-white shadow-md"
                          : hasAppointment(day)
                          ? getAppointmentStatus(day) ===
                            AppointmentStatus.CONFIRMED
                            ? "bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                            : getAppointmentStatus(day) ===
                              AppointmentStatus.CANCELLED
                            ? "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            : getAppointmentStatus(day) ===
                              AppointmentStatus.COMPLETED
                            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                          : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span>{day}</span>
                    {hasAppointment(day) && (
                      <div className="flex items-center justify-center mt-0.5">
                        {getAppointmentCount(day) > 1 ? (
                          <div
                            className={`text-xs px-1 rounded-full ${
                              isToday(day)
                                ? "bg-white text-blue-600"
                                : "bg-blue-500 text-white"
                            }`}
                          >
                            {getAppointmentCount(day)}
                          </div>
                        ) : (
                          <div
                            className={`w-1 h-1 rounded-full ${
                              isToday(day) ? "bg-white" : "bg-blue-500"
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Today's Appointments */}
          {appointmentsByDate[today.toLocaleDateString("en-CA")] && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Today's Appointments
              </h3>
              <div className="space-y-3">
                {appointmentsByDate[today.toLocaleDateString("en-CA")].map(
                  (appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          statusStyles[
                            appointment.status as keyof typeof statusStyles
                          ]
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {appointment.patient?.patientName ||
                                "Unknown Patient"}
                            </div>
                            <div className="text-xs text-gray-600 mt-0.5">
                              with{" "}
                              {appointment.therapist?.name ||
                                "Unknown Therapist"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {appointment.service?.name || "Unknown Service"}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-xs font-medium text-gray-900">
                              {formatTime(appointment.appointmentStartTime)}
                            </div>
                            <div
                              className={`text-xs px-1.5 py-0.5 rounded-full mt-1 ${
                                appointment.status ===
                                AppointmentStatus.CONFIRMED
                                  ? "bg-green-100 text-green-700"
                                  : appointment.status ===
                                    AppointmentStatus.CANCELLED
                                  ? "bg-red-100 text-red-700"
                                  : appointment.status ===
                                    AppointmentStatus.COMPLETED
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {
                                statusLabels[
                                  appointment.status as keyof typeof statusLabels
                                ]
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

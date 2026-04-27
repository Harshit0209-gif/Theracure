import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from "lucide-react";
import { Appointment } from "@/types/appointments";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { statusLabels } from "@/lib/appointment";
import { toISTDateKey } from "@/lib/utils/utils";

interface CalendarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointments: Appointment[];
}

const MONTHS = [
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
const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OFF_DAY_COL = 0;

const STATUS_DOT: Record<string, string> = {
  [AppointmentStatus.CONFIRMED]: "bg-blue-500",
  [AppointmentStatus.COMPLETED]: "bg-emerald-500",
  [AppointmentStatus.CANCELLED]: "bg-red-400",
  [AppointmentStatus.RESCHEDULED]: "bg-amber-400",
};

const STATUS_PILL: Record<string, string> = {
  [AppointmentStatus.CONFIRMED]: "bg-blue-50 text-blue-700",
  [AppointmentStatus.COMPLETED]: "bg-emerald-50 text-emerald-700",
  [AppointmentStatus.CANCELLED]: "bg-red-50 text-red-600",
  [AppointmentStatus.RESCHEDULED]: "bg-amber-50 text-amber-700",
};


function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDayHeading(dateKey: string) {
  const d = new Date(dateKey + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function CalendarViewDialog({
  open,
  onOpenChange,
  appointments = [],
}: CalendarViewDialogProps) {
  const today = useMemo(() => new Date(), []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    toISTDateKey(today),
  );

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [currentMonth, currentYear]);

  const uniqueAppointments = useMemo(() => {
    const byId = new Map<string, Appointment>();

    for (const appointment of appointments) {
      byId.set(appointment.id, appointment);
    }

    return Array.from(byId.values()).sort(
      (a, b) =>
        new Date(a.appointmentStartTime).getTime() -
        new Date(b.appointmentStartTime).getTime(),
    );
  }, [appointments]);

  const appointmentsByDate = useMemo(() => {
    return uniqueAppointments.reduce(
      (acc, appt) => {
        const raw = appt.assignedDate || appt.appointmentStartTime;
        if (!raw) return acc;
        const parsed = new Date(raw);
        if (isNaN(parsed.getTime())) return acc;
        const key = toISTDateKey(parsed);
        if (!acc[key]) acc[key] = [];
        acc[key].push(appt);
        return acc;
      },
      {} as Record<string, Appointment[]>,
    );
  }, [uniqueAppointments]);

  const navigateMonth = (dir: number) => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d;
    });
  };

  const getDayKey = (day: number) =>
    toISTDateKey(new Date(currentYear, currentMonth, day));

  const isToday = (day: number) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  const isSunday = (day: number) =>
    new Date(currentYear, currentMonth, day).getDay() === OFF_DAY_COL;

  const isSelected = (day: number) => getDayKey(day) === selectedDateKey;

  const getDayStatus = (day: number): string | null => {
    const appts = appointmentsByDate[getDayKey(day)];
    if (!appts?.length) return null;
    const unique = [...new Set(appts.map((a) => a.status))];
    return unique.length === 1 ? unique[0] : "mixed";
  };

  const DAY_BG: Record<string, string> = {
    [AppointmentStatus.CONFIRMED]:
      "bg-blue-50 text-blue-800 border border-blue-200",
    [AppointmentStatus.COMPLETED]:
      "bg-emerald-50 text-emerald-800 border border-emerald-200",
    [AppointmentStatus.CANCELLED]:
      "bg-red-50 text-red-700 border border-red-200",
    [AppointmentStatus.RESCHEDULED]:
      "bg-amber-50 text-amber-800 border border-amber-200",
    mixed: "bg-indigo-50 text-indigo-800 border border-indigo-200",
  };

  const selectedAppointments = useMemo(
    () => (selectedDateKey ? (appointmentsByDate[selectedDateKey] ?? []) : []),
    [selectedDateKey, appointmentsByDate],
  );

  // Sort by start time
  const sortedSelected = useMemo(
    () =>
      [...selectedAppointments].sort(
        (a, b) =>
          new Date(a.appointmentStartTime).getTime() -
          new Date(b.appointmentStartTime).getTime(),
      ),
    [selectedAppointments],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl h-[82vh] max-h-[82vh] bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Appointment Calendar
          </DialogTitle>
        </DialogHeader>

        <div className="flex divide-x divide-gray-100 flex-1 min-h-0">
          {/* ── Left: calendar ── */}
          <div className="w-72 md:w-80 flex-shrink-0 p-5 overflow-y-auto">
            {/* Month navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-1 md:grid-cols-7 mb-1">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={d} className="text-center">
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wide ${i === OFF_DAY_COL ? "text-red-400" : "text-gray-400"}`}
                  >
                    {d}
                  </span>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-0.5">
              {days.map((day, i) => {
                if (!day) return <div key={i} />;
                const status = getDayStatus(day);
                const hasAppt = !!status;
                const todayCell = isToday(day);
                const selectedCell = isSelected(day);

                let cellClass =
                  "w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all select-none ";

                const sundayCell = isSunday(day);

                if (selectedCell && !todayCell) {
                  cellClass += "ring-2 ring-indigo-500 ring-offset-1 ";
                }
                if (todayCell) {
                  cellClass += "bg-indigo-600 text-white shadow-sm ";
                } else if (sundayCell) {
                  cellClass += "text-red-300 bg-red-50/60 cursor-default ";
                } else if (hasAppt && status) {
                  cellClass +=
                    (DAY_BG[status] ??
                      "bg-gray-50 text-gray-700 border border-gray-200") + " ";
                } else {
                  cellClass += "text-gray-700 hover:bg-gray-50 ";
                }

                return (
                  <div key={i} className="p-0.5">
                    <div
                      className={cellClass}
                      onClick={() =>
                        !sundayCell && setSelectedDateKey(getDayKey(day))
                      }
                    >
                      <span className="leading-none">{day}</span>
                      {sundayCell && (
                        <span className="text-[8px] text-red-300 leading-none mt-0.5">
                          off
                        </span>
                      )}
                      {!sundayCell && hasAppt && (
                        <div className="flex gap-0.5 mt-0.5">
                          {/* up to 3 dots for different statuses */}
                          {[
                            ...new Set(
                              (appointmentsByDate[getDayKey(day)] ?? []).map(
                                (a) => a.status,
                              ),
                            ),
                          ]
                            .slice(0, 3)
                            .map((s) => (
                              <div
                                key={s}
                                className={`w-1 h-1 rounded-full ${todayCell ? "bg-white/80" : (STATUS_DOT[s] ?? "bg-gray-400")}`}
                              />
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-3 gap-y-1.5">
              {[
                { label: "Confirmed", dot: "bg-blue-500" },
                { label: "Completed", dot: "bg-emerald-500" },
                { label: "Cancelled", dot: "bg-red-400" },
                { label: "Rescheduled", dot: "bg-amber-400" },
                { label: "Sunday (off)", dot: "bg-red-200" },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: day detail panel ── */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100 flex items-center gap-2 flex-shrink-0">
              <CalendarDays className="h-4 w-4 text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-800 truncate">
                {selectedDateKey
                  ? formatDayHeading(selectedDateKey)
                  : "Select a date"}
              </span>
              {sortedSelected.length > 0 && (
                <span className="ml-auto flex-shrink-0 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {sortedSelected.length} appt
                  {sortedSelected.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
              {sortedSelected.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <CalendarDays className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No appointments</p>
                  <p className="text-xs text-gray-300 mt-0.5">on this day</p>
                </div>
              ) : (
                sortedSelected.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-indigo-50/50 transition-colors group"
                  >
                    {/* time column */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                      <div
                        className={`w-2 h-2 rounded-full ${STATUS_DOT[appt.status] ?? "bg-gray-400"}`}
                      />
                      <div className="flex items-center gap-0.5 text-[10px] text-gray-500">
                        <Clock className="h-2.5 w-2.5" />
                        <span>{formatTime(appt.appointmentStartTime)}</span>
                      </div>
                    </div>

                    {/* details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {appt.patient?.patientName || "Unknown Patient"}
                          </p>
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {appt.therapist?.name
                              ? `with ${appt.therapist.name}`
                              : "Therapist unassigned"}
                          </p>
                          {appt.service?.name && (
                            <p className="text-xs text-indigo-600 truncate mt-0.5">
                              {appt.service.name}
                            </p>
                          )}
                        </div>
                        <span
                          className={`flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                            STATUS_PILL[appt.status] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {
                            statusLabels[
                              appt.status as keyof typeof statusLabels
                            ]
                          }
                        </span>
                      </div>
                      {appt.cubicle?.name && (
                        <p className="text-[10px] text-gray-400 mt-1">
                          {appt.cubicle.name}
                          {appt.cubicle.roomNumber &&
                            ` · ${appt.cubicle.roomNumber}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Appointment } from "@/types/appointments";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { statusLabels } from "@/lib/appointment";
import { toISTDateKey } from "@/lib/utils/utils";
import { Holiday, WeeklyOffDay } from "@/types/holiday";

interface CalendarViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FETCH_LIMIT = 500;

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

const DAY_BG: Record<string, string> = {
  [AppointmentStatus.CONFIRMED]:
    "bg-blue-50 text-blue-800 border border-blue-200",
  [AppointmentStatus.COMPLETED]:
    "bg-emerald-50 text-emerald-800 border border-emerald-200",
  [AppointmentStatus.CANCELLED]: "bg-red-50 text-red-700 border border-red-200",
  [AppointmentStatus.RESCHEDULED]:
    "bg-amber-50 text-amber-800 border border-amber-200",
  mixed: "bg-indigo-50 text-indigo-800 border border-indigo-200",
};

function formatTime(dateString: string) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
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
}: CalendarViewDialogProps) {
  const today = useMemo(() => new Date(), []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string>(
    toISTDateKey(today),
  );

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [weeklyOffDays, setWeeklyOffDays] = useState<WeeklyOffDay[]>([]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const fetchAllAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: String(FETCH_LIMIT),
        view: "all",
      });
      const res = await fetch(`/api/appointments?${params}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Failed to load appointments");
      setAppointments(data.appointments ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load appointments",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHolidaysAndWeeklyOff = useCallback(async () => {
    try {
      const [holidaysRes, weeklyOffRes] = await Promise.all([
        fetch("/api/holidays"),
        fetch("/api/weekly-off"),
      ]);
      const holidaysData = await holidaysRes.json();
      const weeklyOffData = await weeklyOffRes.json();
      if (holidaysData.success) setHolidays(holidaysData.data ?? []);
      if (weeklyOffData.success) setWeeklyOffDays(weeklyOffData.data ?? []);
    } catch {
      // Non-fatal: calendar still works, just without holiday/off-day highlighting.
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAllAppointments();
      fetchHolidaysAndWeeklyOff();
    }
  }, [open, fetchAllAppointments, fetchHolidaysAndWeeklyOff]);

  const offWeekDays = useMemo(
    () => new Set(weeklyOffDays.filter((d) => d.isActive).map((d) => d.weekDay)),
    [weeklyOffDays],
  );

  const activeHolidays = useMemo(
    () => holidays.filter((h) => h.isActive),
    [holidays],
  );

  const getHolidayForDay = useCallback(
    (day: number): Holiday | null => {
      const target = new Date(currentYear, currentMonth, day);
      for (const holiday of activeHolidays) {
        const hd = new Date(holiday.date);
        if (holiday.isRecurring) {
          if (hd.getUTCMonth() === target.getMonth() && hd.getUTCDate() === target.getDate()) {
            return holiday;
          }
        } else if (
          hd.getUTCFullYear() === target.getFullYear() &&
          hd.getUTCMonth() === target.getMonth() &&
          hd.getUTCDate() === target.getDate()
        ) {
          return holiday;
        }
      }
      return null;
    },
    [activeHolidays, currentMonth, currentYear],
  );

  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [currentMonth, currentYear]);

  const appointmentsByDate = useMemo(() => {
    const byId = new Map<string, Appointment>();
    for (const appt of appointments) {
      byId.set(appt.id, appt);
    }

    const map: Record<string, Appointment[]> = {};
    for (const appt of byId.values()) {
      const raw = appt.appointmentStartTime;
      if (!raw) continue;
      const parsed = new Date(raw);
      if (isNaN(parsed.getTime())) continue;
      const key = toISTDateKey(parsed);
      if (!map[key]) map[key] = [];
      map[key].push(appt);
    }

    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) =>
          new Date(a.appointmentStartTime).getTime() -
          new Date(b.appointmentStartTime).getTime(),
      );
    }

    return map;
  }, [appointments]);

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

  const isOffDay = (day: number) =>
    offWeekDays.has(new Date(currentYear, currentMonth, day).getDay());

  const isSelected = (day: number) => getDayKey(day) === selectedDateKey;

  const getDayStatus = (day: number): string | null => {
    const appts = appointmentsByDate[getDayKey(day)];
    if (!appts?.length) return null;
    const unique = [...new Set(appts.map((a) => a.status))];
    return unique.length === 1 ? unique[0] : "mixed";
  };

  const selectedAppointments = useMemo(
    () => (selectedDateKey ? (appointmentsByDate[selectedDateKey] ?? []) : []),
    [selectedDateKey, appointmentsByDate],
  );

  const selectedHoliday = useMemo(() => {
    if (!selectedDateKey) return null;
    const [y, m, dd] = selectedDateKey.split("-").map(Number);
    for (const holiday of activeHolidays) {
      const hd = new Date(holiday.date);
      if (holiday.isRecurring) {
        if (hd.getUTCMonth() + 1 === m && hd.getUTCDate() === dd) return holiday;
      } else if (
        hd.getUTCFullYear() === y &&
        hd.getUTCMonth() + 1 === m &&
        hd.getUTCDate() === dd
      ) {
        return holiday;
      }
    }
    return null;
  }, [selectedDateKey, activeHolidays]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl h-[82vh] max-h-[82vh] bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Appointment Calendar
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchAllAppointments}
              disabled={loading}
              className="text-gray-500 hover:text-gray-700 h-8 px-2"
            >
              <RefreshCw
                className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Loading…" : "Refresh"}
            </Button>
          </div>
        </DialogHeader>

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            <button
              onClick={fetchAllAppointments}
              className="ml-auto text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}

        <div className="flex divide-x divide-gray-100 flex-1 min-h-0">
          {/* ── Left: calendar ── */}
          <div className="w-72 md:w-80 flex-shrink-0 p-5 overflow-y-auto">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => navigateMonth(-1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Previous month"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm font-semibold text-gray-800">
                {MONTHS[currentMonth]} {currentYear}
              </span>
              <button
                onClick={() => navigateMonth(1)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Next month"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={d} className="text-center">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                    {d}
                  </span>
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div
              className={`grid grid-cols-7 gap-0.5 transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}
            >
              {days.map((day, i) => {
                if (!day) return <div key={i} />;
                const status = getDayStatus(day);
                const hasAppt = !!status;
                const todayCell = isToday(day);
                const selectedCell = isSelected(day);
                const offDayCell = isOffDay(day);
                const holiday = getHolidayForDay(day);
                const holidayCell = !!holiday;
                const blockedCell = offDayCell || holidayCell;

                let cellClass =
                  "w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm font-medium cursor-pointer transition-all select-none ";

                if (selectedCell && !todayCell) {
                  cellClass += "ring-2 ring-indigo-500 ring-offset-1 ";
                }
                if (todayCell) {
                  cellClass += "bg-indigo-600 text-white shadow-sm ";
                } else if (holidayCell) {
                  cellClass += "text-red-600 bg-red-50 border border-red-200 cursor-default ";
                } else if (offDayCell) {
                  cellClass += "text-gray-400 bg-gray-100 cursor-default ";
                } else if (hasAppt && status) {
                  cellClass +=
                    (DAY_BG[status] ??
                      "bg-gray-50 text-gray-700 border border-gray-200") + " ";
                } else {
                  cellClass += "text-gray-700 hover:bg-gray-50 ";
                }

                const dayAppts = appointmentsByDate[getDayKey(day)] ?? [];

                return (
                  <div key={i} className="p-0.5">
                    <div
                      className={cellClass}
                      title={holiday ? holiday.name : undefined}
                      onClick={() =>
                        !blockedCell && setSelectedDateKey(getDayKey(day))
                      }
                    >
                      <span className="leading-none">{day}</span>
                      {holidayCell && (
                        <span className="text-[8px] text-red-500 leading-none mt-0.5">
                          holiday
                        </span>
                      )}
                      {!holidayCell && offDayCell && (
                        <span className="text-[8px] text-gray-400 leading-none mt-0.5">
                          off
                        </span>
                      )}
                      {!blockedCell && hasAppt && (
                        <div className="flex gap-0.5 mt-0.5">
                          {[...new Set(dayAppts.map((a) => a.status))]
                            .slice(0, 3)
                            .map((s) => (
                              <div
                                key={s}
                                className={`w-1 h-1 rounded-full ${
                                  todayCell
                                    ? "bg-white/80"
                                    : (STATUS_DOT[s] ?? "bg-gray-400")
                                }`}
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
                { label: "Holiday", dot: "bg-red-400" },
                { label: "Weekly Off", dot: "bg-gray-300" },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-[10px] text-gray-500">{label}</span>
                </div>
              ))}
            </div>

            {/* appointment count footer */}
            {!loading && !error && (
              <p className="mt-3 text-[10px] text-gray-400 text-center">
                {appointments.length} appointment
                {appointments.length !== 1 ? "s" : ""} loaded
              </p>
            )}
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
              {selectedAppointments.length > 0 && (
                <span className="ml-auto flex-shrink-0 text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  {selectedAppointments.length} appt
                  {selectedAppointments.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5">
              {selectedHoliday && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700 mb-2">
                  <CalendarDays className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Clinic Closed — <strong>{selectedHoliday.name}</strong>
                  </span>
                </div>
              )}
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <RefreshCw className="h-7 w-7 text-indigo-300 animate-spin mb-2" />
                  <p className="text-sm text-gray-400">Loading appointments…</p>
                </div>
              ) : selectedAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                  <CalendarDays className="h-8 w-8 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No appointments</p>
                  <p className="text-xs text-gray-300 mt-0.5">on this day</p>
                </div>
              ) : (
                selectedAppointments.map((appt) => (
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
                          {appt.services && appt.services.length > 0 && (
                            <p
                              className="text-xs text-indigo-600 truncate mt-0.5"
                              title={appt.services.map((s) => s.name).join(", ")}
                            >
                              {appt.services.length === 1
                                ? appt.services[0].name
                                : `${appt.services.length} Services`}
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

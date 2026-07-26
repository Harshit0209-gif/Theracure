"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getDaysInMonthData(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  return {
    daysInMonth: lastDay.getDate(),
    startingDayOfWeek: firstDay.getDay(),
    year,
    month,
  };
}

export function formatDateToString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPastDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) < today;
}

export function isFutureDate(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) > today;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface DatePickerDialogProps {
  /** Controlled open state */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Currently selected date string (YYYY-MM-DD) */
  value: string;
  /** Called with YYYY-MM-DD when user picks a date */
  onChange: (date: string) => void;
  /** Dialog title */
  title?: string;
  /** Whether to disable past dates (default: true) */
  disablePast?: boolean;
  /** Whether to disable future dates (default: false) */
  disableFuture?: boolean;
  /** Extra className on DialogContent for positioning overrides */
  contentClassName?: string;
  /** Whether to show fast year navigation (prev/next year + clickable year list). Default: false — existing callers are unaffected. */
  enableYearPicker?: boolean;
  /** Earliest year shown in the year list (only used when enableYearPicker is true). Default: 1900 */
  minYear?: number;
  /** Latest year shown in the year list (only used when enableYearPicker is true). Default: current year */
  maxYear?: number;
  /** Map of YYYY-MM-DD -> reason text. Matching dates are disabled and show the reason as a tooltip. Default: none. */
  disabledDateReasons?: Record<string, string>;
  /** Weekdays (0=Sunday..6=Saturday) that are always disabled, e.g. clinic weekly-off days. Default: none. */
  disabledWeekDays?: number[];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DatePickerDialog({
  open,
  onOpenChange,
  value,
  onChange,
  title = "Select Date",
  disablePast = true,
  disableFuture = false,
  contentClassName,
  enableYearPicker = false,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  disabledDateReasons,
  disabledWeekDays,
}: DatePickerDialogProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date();
  });
  const [view, setView] = useState<"days" | "years">("days");

  // Keep month in sync when dialog opens with a pre-selected value
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setView("days");
      if (value) {
        const d = new Date(value);
        if (!isNaN(d.getTime())) {
          setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
        }
      }
    }
    onOpenChange(next);
  };

  const prevMonth = () => {
    setCurrentMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setCurrentMonth((m) => {
      const d = new Date(m);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const prevYear = () => {
    setCurrentMonth((m) => {
      const d = new Date(m);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    });
  };

  const nextYear = () => {
    setCurrentMonth((m) => {
      const d = new Date(m);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    });
  };

  const handleSelectYear = (selectedYear: number) => {
    setCurrentMonth((m) => new Date(selectedYear, m.getMonth(), 1));
    setView("days");
  };

  const handleSelect = (dateStr: string) => {
    onChange(dateStr);
    onOpenChange(false);
  };

  const handleToday = () => {
    const today = formatDateToString(new Date());
    onChange(today);
    setCurrentMonth(new Date());
    onOpenChange(false);
  };

  const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonthData(currentMonth);
  const todayStr = formatDateToString(new Date());

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`max-w-md p-4 ${contentClassName ?? ""}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month/Year Navigation */}
          <div className="flex items-center justify-between gap-1">
            {enableYearPicker && view === "days" && (
              <Button type="button" variant="outline" size="sm" onClick={prevYear} title="Previous year">
                «
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={prevMonth} disabled={view === "years"}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
            {enableYearPicker ? (
              <button
                type="button"
                onClick={() => setView((v) => (v === "days" ? "years" : "days"))}
                className="text-base font-semibold text-slate-800 hover:text-indigo-600 transition-colors px-2 rounded-md hover:bg-indigo-50"
              >
                {view === "years"
                  ? "Select Year"
                  : currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </button>
            ) : (
              <h3 className="text-base font-semibold text-slate-800">
                {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
            )}
            <Button type="button" variant="outline" size="sm" onClick={nextMonth} disabled={view === "years"}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
            {enableYearPicker && view === "days" && (
              <Button type="button" variant="outline" size="sm" onClick={nextYear} title="Next year">
                »
              </Button>
            )}
          </div>

          {enableYearPicker && view === "years" && (
            <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto pr-1">
              {Array.from(
                { length: maxYear - minYear + 1 },
                (_, i) => maxYear - i
              ).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleSelectYear(y)}
                  className={[
                    "h-9 rounded-md text-sm transition-colors",
                    y === currentMonth.getFullYear()
                      ? "bg-indigo-600 text-white font-semibold"
                      : "hover:bg-indigo-100 text-slate-700",
                  ].join(" ")}
                >
                  {y}
                </button>
              ))}
            </div>
          )}

          {/* Calendar Grid */}
          {(!enableYearPicker || view === "days") && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-1 text-center text-sm">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="font-semibold text-gray-500 pb-1">
                {day}
              </div>
            ))}

            {/* Empty cells before first day */}
            {Array.from({ length: startingDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(year, month, day);
              const dateStr = formatDateToString(date);
              const isSelected = value === dateStr;
              const isPast = disablePast && isPastDate(dateStr);
              const isFuture = disableFuture && isFutureDate(dateStr);
              const closedReason = disabledDateReasons?.[dateStr];
              const isClosed = !!closedReason;
              const isWeeklyOff = !!disabledWeekDays?.includes(date.getDay());
              const isDisabled = isPast || isFuture || isClosed || isWeeklyOff;
              const isToday = dateStr === todayStr;
              const tooltip = closedReason || (isWeeklyOff ? "Clinic weekly off day" : undefined);

              return (
                <div key={day} className="p-1">
                  <button
                    type="button"
                    onClick={() => !isDisabled && handleSelect(dateStr)}
                    disabled={isDisabled}
                    title={tooltip}
                    className={[
                      "w-full h-9 rounded-md transition-colors text-sm",
                      isDisabled
                        ? isClosed
                          ? "text-red-400 bg-red-50 cursor-not-allowed"
                          : isWeeklyOff
                          ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                          : "text-gray-400 cursor-not-allowed"
                        : isSelected
                        ? "bg-indigo-600 text-white font-semibold"
                        : "hover:bg-indigo-100 text-slate-700",
                      isToday && !isSelected
                        ? "border-2 border-indigo-600 font-semibold"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 pt-2 border-t border-gray-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

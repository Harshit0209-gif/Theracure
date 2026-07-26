import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Calendar, CheckCircle, User, XCircle } from "lucide-react";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { TimeInput } from "@/components/ui/time-input";
import { toast } from "@/components/ui/use-toast";
import {
  Appointment,
  AvailablePeriod,
  DefaultRescheduleAppointmentData,
  RescheduleAppointmentData,
} from "@/types/appointments";
import {
  formatDate,
  formatTime,
  formatTimeString,
  getDayName,
} from "@/lib/utils/utils";
import { Holiday, WeeklyOffDay } from "@/types/holiday";

interface RescheduleAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
}

export function RescheduleAppointmentDialog({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}: RescheduleAppointmentDialogProps) {
  const [rescheduleData, setRescheduleData] =
    useState<RescheduleAppointmentData>(DefaultRescheduleAppointmentData);
  const [actionLoading, setActionLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>(
    [],
  );
  const [disabledDateReasons, setDisabledDateReasons] = useState<
    Record<string, string>
  >({});
  const [disabledWeekDays, setDisabledWeekDays] = useState<number[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchHolidaysAndWeeklyOff = async () => {
      try {
        const [holidaysRes, weeklyOffRes] = await Promise.all([
          fetch("/api/holidays"),
          fetch("/api/weekly-off"),
        ]);
        const holidaysData = await holidaysRes.json();
        const weeklyOffData = await weeklyOffRes.json();

        if (holidaysData.success) {
          const reasons: Record<string, string> = {};
          (holidaysData.data as Holiday[])
            .filter((h) => h.isActive)
            .forEach((h) => {
              if (h.isRecurring) {
                const d = new Date(h.date);
                const month = d.getUTCMonth();
                const day = d.getUTCDate();
                const thisYear = new Date().getFullYear();
                [thisYear, thisYear + 1].forEach((year) => {
                  const occurrence = new Date(Date.UTC(year, month, day));
                  const key = occurrence.toISOString().slice(0, 10);
                  reasons[key] = h.name;
                });
              } else {
                reasons[h.date.slice(0, 10)] = h.name;
              }
            });
          setDisabledDateReasons(reasons);
        }

        if (weeklyOffData.success) {
          setDisabledWeekDays(
            (weeklyOffData.data as WeeklyOffDay[])
              .filter((d) => d.isActive)
              .map((d) => d.weekDay),
          );
        }
      } catch (error) {
        console.error("Error fetching holidays/weekly-off:", error);
      }
    };

    fetchHolidaysAndWeeklyOff();
  }, [isOpen]);

  const validateTimeRange = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return false;

    // Compare time strings directly (HH:MM format)
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    return endMinutes > startMinutes;
  };

  // Initialize form data when dialog opens
  useEffect(() => {
    if (appointment && isOpen) {
      setRescheduleData(DefaultRescheduleAppointmentData);
    }
  }, [appointment, isOpen]);

  const handleRescheduleAppointment = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);

      // Combine date and time to create full datetime
      const startDateTime = new Date(
        `${rescheduleData.date}T${rescheduleData.appointmentStartTime}:00`,
      );
      const endDateTime = new Date(
        `${rescheduleData.date}T${rescheduleData.appointmentEndTime}:00`,
      );

      const response = await fetch(
        `/api/appointments/${appointment.id}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentStartTime: startDateTime.toISOString(),
            appointmentEndTime: endDateTime.toISOString(),
            reason: rescheduleData.reason,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to reschedule appointment",
        );
      }

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });

      onClose();
      onAppointmentUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to reschedule appointment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    const checkTherapistAvailability = async (therapistId: string) => {
      setIsCheckingAvailability(true);

      try {
        const appointmentDate = rescheduleData.date;
        const therapistResponse = await fetch(
          `/api/therapists/${therapistId}/availability?date=${appointmentDate}`,
        );
        const therapistData = await therapistResponse.json();

        if (!therapistData?.success) {
          throw new Error(
            therapistData?.error ||
              "Failed to fetch therapist schedule and availability",
          );
        }

        const availablePeriods: AvailablePeriod[] =
          therapistData.availablePeriods.map((period: any) => ({
            startTime: period.startTime,
            endTime: period.endTime,
            available: period.available,
            duration: period.duration,
          }));
        setAvailablePeriods(availablePeriods);
      } catch (error) {
        console.error("Error checking availability:", error);
      } finally {
        setIsCheckingAvailability(false);
      }
    };
    if (appointment?.therapist?.id && rescheduleData.date) {
      checkTherapistAvailability(appointment.therapist.id);
    } else {
      setAvailablePeriods([]);
    }
  }, [appointment?.therapist?.id, rescheduleData.date]);

  const resetAndClose = () => {
    setRescheduleData(DefaultRescheduleAppointmentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600" />
            Reschedule Appointment
          </DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-6">
            {/* Appointment summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {appointment.patient?.patientName}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                with {appointment.therapist?.name}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Current: {formatDate(appointment.appointmentStartTime)} •{" "}
                {formatTime(appointment.appointmentStartTime)} –{" "}
                {formatTime(appointment.appointmentEndTime)}
              </p>
            </div>
          </div>
        )}

        {/* Date + time pickers */}
        <div className="space-y-4">
          <DatePickerButton
            label="Booking Date"
            value={rescheduleData.date}
            onChange={(date) => setRescheduleData({ ...rescheduleData, date })}
            title="Select Appointment Date"
            disabledDateReasons={disabledDateReasons}
            disabledWeekDays={disabledWeekDays}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TimeInput
              id="rescheduleStartTime"
              label="Start Time"
              value={rescheduleData.appointmentStartTime}
              onChange={(val) =>
                setRescheduleData((prev) => ({
                  ...prev,
                  appointmentStartTime: val,
                  appointmentEndTime: val >= prev.appointmentEndTime ? "" : prev.appointmentEndTime,
                }))
              }
              disabled={!rescheduleData.date}
            />
            <TimeInput
              id="rescheduleEndTime"
              label="End Time"
              value={rescheduleData.appointmentEndTime}
              onChange={(val) => setRescheduleData({ ...rescheduleData, appointmentEndTime: val })}
              disabled={!rescheduleData.date || !rescheduleData.appointmentStartTime}
              min={rescheduleData.appointmentStartTime || undefined}
            />
          </div>
        </div>

        {/* Doctor availability */}
        {rescheduleData.date && (
          <div className="space-y-2">
            <Label>Availability Status</Label>
            <div className="border rounded-lg p-4 bg-white">
              {isCheckingAvailability ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent" />
                  Checking availability...
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {getDayName(rescheduleData.date)} –{" "}
                      {new Date(rescheduleData.date).toLocaleDateString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                  {availablePeriods.length > 0 ? (
                    <div className="space-y-3 mt-2">
                      <p className="text-sm text-gray-600">
                        Available periods:
                      </p>
                      {availablePeriods.map((period, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            period.available
                              ? "bg-green-50 border-green-200 text-green-800"
                              : "bg-red-50 border-red-200 text-red-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {period.available ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <XCircle className="h-4 w-4" />
                            )}
                            <span className="font-medium">
                              {formatTimeString(period.startTime)} –{" "}
                              {formatTimeString(period.endTime)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>No available time periods for this date</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reason */}
        <div>
          <Label htmlFor="rescheduleReason">Reason *</Label>
          <Textarea
            id="rescheduleReason"
            placeholder="Please provide a reason for rescheduling..."
            value={rescheduleData.reason}
            onChange={(e) =>
              setRescheduleData({
                ...rescheduleData,
                reason: e.target.value,
              })
            }
            rows={3}
            required
          />
        </div>

        {/* Validation */}
        {rescheduleData.appointmentStartTime &&
          rescheduleData.appointmentEndTime &&
          !validateTimeRange(
            rescheduleData.appointmentStartTime,
            rescheduleData.appointmentEndTime,
          ) && (
            <p className="text-sm text-red-600">
              End time must be after start time
            </p>
          )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={handleRescheduleAppointment}
            disabled={
              actionLoading ||
              !rescheduleData.date ||
              !rescheduleData.appointmentStartTime ||
              !rescheduleData.appointmentEndTime ||
              !rescheduleData.reason.trim() ||
              !validateTimeRange(
                rescheduleData.appointmentStartTime,
                rescheduleData.appointmentEndTime,
              )
            }
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {actionLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Rescheduling...
              </div>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Confirm Reschedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

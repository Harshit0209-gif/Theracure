import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  User,
  XCircle,
} from "lucide-react";
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";
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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      // Ensure date picker is closed when checking availability
      setIsDatePickerOpen(false);

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
    setIsDatePickerOpen(false);
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
          {/* Date picker */}
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Booking Date</Label>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDatePickerOpen(true)}
              className="w-full flex justify-between items-center bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 h-11 px-4 transition-all shadow-sm"
            >
              <span className={rescheduleData.date ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
                {rescheduleData.date
                  ? new Date(rescheduleData.date).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })
                  : "Select date..."}
              </span>
              <Calendar className="h-4 w-4 text-indigo-500 opacity-70" />
            </Button>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rescheduleStartTime" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                Start Time
              </Label>
              <Input
                id="rescheduleStartTime"
                type="time"
                value={rescheduleData.appointmentStartTime}
                onChange={(e) => {
                  const val = e.target.value;
                  setRescheduleData((prev) => ({
                    ...prev,
                    appointmentStartTime: val,
                    appointmentEndTime: val >= prev.appointmentEndTime ? "" : prev.appointmentEndTime,
                  }));
                }}
                disabled={!rescheduleData.date}
                className="bg-white border-indigo-300 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rescheduleEndTime" className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Clock className="h-4 w-4 text-indigo-500" />
                End Time
              </Label>
              <Input
                id="rescheduleEndTime"
                type="time"
                value={rescheduleData.appointmentEndTime}
                onChange={(e) =>
                  setRescheduleData({ ...rescheduleData, appointmentEndTime: e.target.value })
                }
                disabled={!rescheduleData.date || !rescheduleData.appointmentStartTime}
                min={rescheduleData.appointmentStartTime || undefined}
                className="bg-white border-indigo-300 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        <DatePickerDialog
          open={isDatePickerOpen}
          onOpenChange={setIsDatePickerOpen}
          value={rescheduleData.date}
          onChange={(date) => setRescheduleData({ ...rescheduleData, date })}
          title="Select Appointment Date"
        />

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

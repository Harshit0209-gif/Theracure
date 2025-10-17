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
  CalendarIcon,
  CheckCircle,
  User,
  XCircle,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/components/ui/use-toast";
import {
  Appointment,
  AvailablePeriod,
  DefaultRescheduleAppointmentData,
  RescheduleAppointmentData,
  TherapistAvailability,
} from "@/types/appointments";
import { formatDate, formatTime, getDayName } from "@/lib/utils/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

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
  const [therapistSchedule, setTherapistSchedule] = useState<
    TherapistAvailability[]
  >([]);
  const [availablePeriods, setAvailablePeriods] = useState<AvailablePeriod[]>(
    []
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end;
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

      const response = await fetch(
        `/api/appointments/${appointment.id}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            appointmentStartTime: new Date(
              rescheduleData.appointmentStartTime
            ).toISOString(),
            appointmentEndTime: new Date(
              rescheduleData.appointmentEndTime
            ).toISOString(),
            reason: rescheduleData.reason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to reschedule appointment"
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
    const checkTherapistAvailability = async (
      therapistId: string,
      date: string
    ) => {
      setIsCheckingAvailability(true);
      try {
        const appointmentDate = rescheduleData.date;
        const therapistResponse = await fetch(
          `/api/therapists/${therapistId}/availability?date=${appointmentDate}`
        );
        const therapistData = await therapistResponse.json();

        if (!therapistData?.success) {
          throw new Error(
            therapistData?.error ||
              "Failed to fetch therapist schedule and availability"
          );
        }

        const schedule: TherapistAvailability[] =
          therapistData.therapistSchedule?.map((slot: any) => ({
            dayOfWeek: slot.weekDay,
            startTime: slot.startTime,
            endTime: slot.endTime,
          }));
        setTherapistSchedule(schedule);

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
      checkTherapistAvailability(appointment.therapist.id, rescheduleData.date);
    } else {
      setTherapistSchedule([]);
      setAvailablePeriods([]);
    }
  }, [appointment?.therapist?.id, rescheduleData.date]);

  const resetAndClose = () => {
    setRescheduleData(DefaultRescheduleAppointmentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
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
        <div className="grid grid-cols-3 gap-4">
          {/* Date picker */}
          <div className="col-span-1">
            <Label>New Date</Label>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`w-full justify-start text-left font-normal ${
                    !rescheduleData.date ? "text-muted-foreground" : ""
                  }`}
                >
                  {rescheduleData.date
                    ? formatDate(new Date(rescheduleData.date).toDateString())
                    : "Pick a date"}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={
                    rescheduleData.date
                      ? new Date(rescheduleData.date)
                      : undefined
                  }
                  onSelect={(date: Date | undefined) => {
                    if (date) {
                      setRescheduleData({
                        ...rescheduleData,
                        date: date.toISOString().split("T")[0],
                      });
                      setIsDatePickerOpen(false); // ✅ close popover after selecting
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Start time */}
          <div>
            <Label htmlFor="rescheduleStartTime">Start</Label>
            <Input
              id="rescheduleStartTime"
              type="time"
              value={rescheduleData.appointmentStartTime}
              onChange={(e) =>
                setRescheduleData({
                  ...rescheduleData,
                  appointmentStartTime: e.target.value,
                })
              }
              disabled={!rescheduleData.date}
            />
          </div>

          {/* End time */}
          <div>
            <Label htmlFor="rescheduleEndTime">End</Label>
            <Input
              id="rescheduleEndTime"
              type="time"
              value={rescheduleData.appointmentEndTime}
              onChange={(e) =>
                setRescheduleData({
                  ...rescheduleData,
                  appointmentEndTime: e.target.value,
                })
              }
              disabled={!rescheduleData.date}
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
                    <Calendar className="h-4 w-4 text-indigo-600" />
                    <span className="font-medium">
                      {getDayName(rescheduleData.date)} –{" "}
                      {new Date(rescheduleData.date).toLocaleDateString(
                        "en-IN"
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
                              {formatTime(period.startTime)} –{" "}
                              {formatTime(period.endTime)}
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
            rescheduleData.appointmentEndTime
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
              !rescheduleData.reason.trim() ||
              !validateTimeRange(
                rescheduleData.appointmentStartTime,
                rescheduleData.appointmentEndTime
              )
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            {actionLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Rescheduling...
              </div>
            ) : (
              <>
                <CalendarIcon className="h-4 w-4 mr-2" />
                Confirm Reschedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

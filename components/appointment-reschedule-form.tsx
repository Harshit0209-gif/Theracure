import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";
import { Calendar, Clock } from "lucide-react";

const rescheduleSchema = z.object({
  appointmentDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
});

type RescheduleFormData = z.infer<typeof rescheduleSchema>;

interface AppointmentRescheduleFormProps {
  appointment: any;
  onSubmit: (data: RescheduleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function AppointmentRescheduleForm({
  appointment,
  onSubmit,
  onCancel,
  isLoading,
}: AppointmentRescheduleFormProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      appointmentDate: new Date(appointment.appointmentStartTime)
        .toISOString()
        .split("T")[0],
      startTime: new Date(appointment.appointmentStartTime)
        .toTimeString()
        .slice(0, 5),
      endTime: new Date(appointment.appointmentEndTime)
        .toTimeString()
        .slice(0, 5),
    },
  });

  const watchedDate = form.watch("appointmentDate");
  const watchedStart = form.watch("startTime");

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Date picker */}
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">Booking Date</Label>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCalendarOpen(true)}
            className="w-full flex justify-between items-center bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 h-11 px-4 transition-all shadow-sm"
          >
            <span className={watchedDate ? "text-slate-900 font-bold" : "text-slate-400 font-medium"}>
              {watchedDate
                ? new Date(watchedDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : "Select date..."}
            </span>
            <Calendar className="h-4 w-4 text-indigo-500 opacity-70" />
          </Button>
          {form.formState.errors.appointmentDate && (
            <p className="text-xs text-red-500">
              {form.formState.errors.appointmentDate.message}
            </p>
          )}
        </div>

        {/* Time inputs */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label
              htmlFor="startTime"
              className="text-sm font-bold text-slate-700 flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-indigo-500" />
              Start Time
            </Label>
            <Input
              id="startTime"
              type="time"
              value={watchedStart || ""}
              onChange={(e) => {
                form.setValue("startTime", e.target.value);
                const endTime = form.getValues("endTime");
                if (endTime && e.target.value >= endTime) {
                  form.setValue("endTime", "");
                }
              }}
              className="bg-white border-indigo-300 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            {form.formState.errors.startTime && (
              <p className="text-xs text-red-500">
                {form.formState.errors.startTime.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="endTime"
              className="text-sm font-bold text-slate-700 flex items-center gap-2"
            >
              <Clock className="h-4 w-4 text-indigo-500" />
              End Time
            </Label>
            <Input
              id="endTime"
              type="time"
              value={form.watch("endTime") || ""}
              onChange={(e) => form.setValue("endTime", e.target.value)}
              disabled={!watchedStart}
              min={watchedStart || undefined}
              className="bg-white border-indigo-300 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            {form.formState.errors.endTime && (
              <p className="text-xs text-red-500">
                {form.formState.errors.endTime.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isLoading ? "Rescheduling..." : "Reschedule"}
          </Button>
        </div>
      </form>

      <DatePickerDialog
        open={isCalendarOpen}
        onOpenChange={setIsCalendarOpen}
        value={watchedDate}
        onChange={(date) => form.setValue("appointmentDate", date)}
        title="Select Appointment Date"
      />
    </>
  );
}

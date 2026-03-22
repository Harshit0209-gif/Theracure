import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { DatePickerButton } from "@/components/ui/date-picker-button";
import { TimeInput } from "@/components/ui/time-input";

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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      {/* Date picker */}
      <div>
        <DatePickerButton
          label="Booking Date"
          value={watchedDate}
          onChange={(date) => form.setValue("appointmentDate", date)}
          title="Select Appointment Date"
        />
        {form.formState.errors.appointmentDate && (
          <p className="text-xs text-red-500 mt-1">
            {form.formState.errors.appointmentDate.message}
          </p>
        )}
      </div>

      {/* Time inputs */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <TimeInput
            id="startTime"
            label="Start Time"
            value={watchedStart || ""}
            onChange={(val) => {
              form.setValue("startTime", val);
              const endTime = form.getValues("endTime");
              if (endTime && val >= endTime) form.setValue("endTime", "");
            }}
          />
          {form.formState.errors.startTime && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.startTime.message}
            </p>
          )}
        </div>

        <div>
          <TimeInput
            id="endTime"
            label="End Time"
            value={form.watch("endTime") || ""}
            onChange={(val) => form.setValue("endTime", val)}
            disabled={!watchedStart}
            min={watchedStart || undefined}
          />
          {form.formState.errors.endTime && (
            <p className="text-xs text-red-500 mt-1">
              {form.formState.errors.endTime.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
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
  );
}

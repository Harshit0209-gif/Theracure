import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

const rescheduleSchema = z.object({
  appointmentDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time")
})

type RescheduleFormData = z.infer<typeof rescheduleSchema>

interface AppointmentRescheduleFormProps {
  appointment: any
  onSubmit: (data: RescheduleFormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function AppointmentRescheduleForm({ appointment, onSubmit, onCancel, isLoading }: AppointmentRescheduleFormProps) {
  const [availableSlots, setAvailableSlots] = useState([])
  const form = useForm<RescheduleFormData>({
    resolver: zodResolver(rescheduleSchema),
    defaultValues: {
      appointmentDate: new Date(appointment.appointmentStartTime).toISOString().split('T')[0],
      startTime: new Date(appointment.appointmentStartTime).toTimeString().slice(0, 5),
      endTime: new Date(appointment.appointmentEndTime).toTimeString().slice(0, 5)
    }
  })

  const checkAvailability = async (date: string) => {
    try {
      const response = await fetch(`/api/therapists/${appointment.therapistId}/availability?date=${date}`)
      const data = await response.json()
      if (data.success) {
        setAvailableSlots(data.availability)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
      toast({
        title: "Error",
        description: "Failed to check therapist availability",
        variant: "destructive",
      })
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue("appointmentDate", e.target.value)
    checkAvailability(e.target.value)
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="appointmentDate">Date</Label>
        <Input
          id="appointmentDate"
          type="date"
          {...form.register("appointmentDate")}
          onChange={handleDateChange}
          min={new Date().toISOString().split('T')[0]}
        />
        {form.formState.errors.appointmentDate && (
          <p className="text-sm text-red-500">{form.formState.errors.appointmentDate.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Start Time</Label>
          <Input
            id="startTime"
            type="time"
            {...form.register("startTime")}
          />
          {form.formState.errors.startTime && (
            <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endTime">End Time</Label>
          <Input
            id="endTime"
            type="time"
            {...form.register("endTime")}
          />
          {form.formState.errors.endTime && (
            <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
          )}
        </div>
      </div>

      {availableSlots.length > 0 && (
        <div className="space-y-2">
          <Label>Available Time Slots</Label>
          <div className="grid grid-cols-2 gap-2">
            {availableSlots.map((slot: any) => (
              <Button
                key={slot.id}
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  form.setValue("startTime", slot.startTime)
                  form.setValue("endTime", slot.endTime)
                }}
              >
                {slot.startTime} - {slot.endTime}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
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
        >
          {isLoading ? "Rescheduling..." : "Reschedule"}
        </Button>
      </div>
    </form>
  )
} 
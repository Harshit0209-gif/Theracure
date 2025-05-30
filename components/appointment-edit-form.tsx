import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const editAppointmentSchema = z.object({
  therapyType: z.string().min(1, "Please select therapy type"),
  notes: z.string().optional()
})

type EditAppointmentFormData = z.infer<typeof editAppointmentSchema>

interface AppointmentEditFormProps {
  appointment: any
  onSubmit: (data: EditAppointmentFormData) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

export function AppointmentEditForm({ appointment, onSubmit, onCancel, isLoading }: AppointmentEditFormProps) {
  const form = useForm<EditAppointmentFormData>({
    resolver: zodResolver(editAppointmentSchema),
    defaultValues: {
      therapyType: appointment.therapyType,
      notes: appointment.notes || ""
    }
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="therapyType">Therapy Type</Label>
        <Select 
          onValueChange={(value) => form.setValue("therapyType", value)}
          defaultValue={appointment.therapyType}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select therapy type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Physical Therapy">Physical Therapy</SelectItem>
            <SelectItem value="Occupational Therapy">Occupational Therapy</SelectItem>
            <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
            <SelectItem value="Consultation">Consultation</SelectItem>
            <SelectItem value="Assessment">Assessment</SelectItem>
            <SelectItem value="Follow-up">Follow-up</SelectItem>
          </SelectContent>
        </Select>
        {form.formState.errors.therapyType && (
          <p className="text-sm text-red-500">{form.formState.errors.therapyType.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          {...form.register("notes")}
        />
      </div>

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
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  )
} 
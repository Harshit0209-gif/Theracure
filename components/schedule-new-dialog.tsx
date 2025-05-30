import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"

const appointmentSchema = z.object({
  patientId: z.string().min(1, "Please select a patient"),
  therapistId: z.string().min(1, "Please select a therapist"),
  appointmentDate: z.string().min(1, "Please select a date"),
  startTime: z.string().min(1, "Please select start time"),
  endTime: z.string().min(1, "Please select end time"),
  therapyType: z.string().min(1, "Please select therapy type"),
  notes: z.string().optional()
})

type AppointmentFormData = z.infer<typeof appointmentSchema>

interface ScheduleNewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAppointmentCreated: () => void
}

export function ScheduleNewDialog({ open, onOpenChange, onAppointmentCreated }: ScheduleNewDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [patients, setPatients] = useState([])
  const [therapists, setTherapists] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [serverError, setServerError] = useState<string | null>(null)
  const { user } = useAuth()

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      patientId: "",
      therapistId: "",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      therapyType: "",
      notes: ""
    }
  })

  // Fetch patients and therapists when dialog opens
  useEffect(() => {
    if (open) {
      fetchPatients()
      fetchTherapists()
    }
  }, [open])

  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patients?limit=100')
      const data = await response.json()
      if (data.success) {
        setPatients(data.patients)
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    }
  }

  const fetchTherapists = async () => {
    try {
      const response = await fetch('/api/users?role=therapist&limit=100')
      const data = await response.json()
      if (data.success) {
        console.log('Fetched therapists:', data.users)
        setTherapists(data.users)
      }
    } catch (error) {
      console.error('Error fetching therapists:', error)
    }
  }

  const checkAvailability = async (therapistId: string, date: string) => {
    try {
      const response = await fetch(`/api/therapists/${therapistId}/availability?date=${date}`)
      const data = await response.json()
      if (data.success) {
        setAvailableSlots(data.availability)
      }
    } catch (error) {
      console.error('Error checking availability:', error)
    }
  }

  const onSubmit = async (data: AppointmentFormData) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add an appointment",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      setServerError(null) // Clear any previous errors
      console.log("Form data:", data)
      console.log("Selected therapist ID:", data.therapistId)
      
      const appointmentData = {
        ...data,
        appointmentStartTime: new Date(`${data.appointmentDate}T${data.startTime}`).toISOString(),
        appointmentEndTime: new Date(`${data.appointmentDate}T${data.endTime}`).toISOString(),
        createdById: user.id
      }
      console.log("Appointment data:", appointmentData)

      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      })

      const result = await response.json()

      if (!response.ok) {
        setServerError(result.error || 'Failed to schedule appointment')
        return
      }

      toast({
        title: "Success",
        description: "Appointment scheduled successfully",
      })

      form.reset()
      onOpenChange(false)
      onAppointmentCreated()
    } catch (error) {
      console.error('Appointment creation error:', error)
      setServerError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment by selecting patient, therapist, and available time slot.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md mb-4">
            {serverError}
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label htmlFor="patientId">Patient</Label>
              <Select onValueChange={(value) => form.setValue("patientId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient: any) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      {patient.patientName} ({patient.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.patientId && (
                <p className="text-sm text-red-500">{form.formState.errors.patientId.message}</p>
              )}
            </div>

            {/* Therapist Selection */}
            <div className="space-y-2">
              <Label htmlFor="therapistId">Therapist</Label>
              <Select onValueChange={(value) => form.setValue("therapistId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select therapist" />
                </SelectTrigger>
                <SelectContent>
                  {therapists.map((therapist: any) => (
                    <SelectItem key={therapist.id} value={therapist.id}>
                      {therapist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.therapistId && (
                <p className="text-sm text-red-500">{form.formState.errors.therapistId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Date</Label>
              <Input
                id="appointmentDate"
                type="date"
                {...form.register("appointmentDate")}
                min={new Date().toISOString().split('T')[0]}
              />
              {form.formState.errors.appointmentDate && (
                <p className="text-sm text-red-500">{form.formState.errors.appointmentDate.message}</p>
              )}
            </div>

            {/* Start Time */}
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

            {/* End Time */}
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

          {/* Therapy Type */}
          <div className="space-y-2">
            <Label htmlFor="therapyType">Therapy Type</Label>
            <Select onValueChange={(value) => form.setValue("therapyType", value)}>
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

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or instructions..."
              {...form.register("notes")}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Scheduling...
                </div>
              ) : (
                "Schedule Appointment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
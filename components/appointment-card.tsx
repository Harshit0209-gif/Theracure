import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { Edit, Calendar, CheckCircle, X, Clock, MoreHorizontal } from "lucide-react"
import { format } from "date-fns"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AppointmentEditForm } from "./appointment-edit-form"
import { AppointmentRescheduleForm } from "./appointment-reschedule-form"

interface AppointmentCardProps {
  appointment: any
  onAppointmentUpdated: () => void
}

export function AppointmentCard({ appointment, onAppointmentUpdated }: AppointmentCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRescheduleDialogOpen, setIsRescheduleDialogOpen] = useState(false)

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appointment')
      }

      toast({
        title: "Success",
        description: `Appointment ${status} successfully`,
      })

      onAppointmentUpdated()
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (data: any) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appointment')
      }

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      })

      setIsEditDialogOpen(false)
      onAppointmentUpdated()
    } catch (error) {
      console.error('Error updating appointment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleReschedule = async (data: any) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentStartTime: new Date(`${data.appointmentDate}T${data.startTime}`).toISOString(),
          appointmentEndTime: new Date(`${data.appointmentDate}T${data.endTime}`).toISOString(),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reschedule appointment')
      }

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      })

      setIsRescheduleDialogOpen(false)
      onAppointmentUpdated()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule appointment",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <h3 className="text-lg font-semibold">{appointment.patient?.patientName || "No Patient"}</h3>
          <p className="text-sm text-gray-500">{appointment.therapyType}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(appointment.status)}>
            {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {appointment.status === 'confirmed' && (
                <>
                  <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Appointment
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsRescheduleDialogOpen(true)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Reschedule
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleStatusUpdate(appointment.id, 'completed')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                </>
              )}
              {appointment.status !== 'cancelled' && (
                <DropdownMenuItem 
                  className="text-red-600"
                  onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Appointment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <Clock className="mr-2 h-4 w-4 text-gray-500" />
            <span>
              {format(new Date(appointment.appointmentStartTime), 'MMM d, yyyy h:mm a')} - 
              {format(new Date(appointment.appointmentEndTime), 'h:mm a')}
            </span>
          </div>
          <div className="text-sm">
            <span className="font-medium">Therapist: </span>
            {appointment.therapist.name}
          </div>
          {appointment.notes && (
            <div className="text-sm">
              <span className="font-medium">Notes: </span>
              {appointment.notes}
            </div>
          )}
        </div>
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details
            </DialogDescription>
          </DialogHeader>
          <AppointmentEditForm
            appointment={appointment}
            onSubmit={handleEdit}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Reschedule Dialog */}
      <Dialog open={isRescheduleDialogOpen} onOpenChange={setIsRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>
              Select a new date and time for the appointment
            </DialogDescription>
          </DialogHeader>
          <AppointmentRescheduleForm
            appointment={appointment}
            onSubmit={handleReschedule}
            onCancel={() => setIsRescheduleDialogOpen(false)}
            isLoading={isLoading}
          />
        </DialogContent>
      </Dialog>
    </Card>
  )
} 
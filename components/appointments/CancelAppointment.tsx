import { useState } from "react";
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
import { X, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Appointment, CancelData } from "@/types/appointments";

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
}

export function CancelAppointmentDialog({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}: CancelAppointmentDialogProps) {
  const [cancelData, setCancelData] = useState<CancelData>({
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/appointments/${appointment.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: cancelData.reason,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to cancel appointment");
      }

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      });

      onClose();
      onAppointmentUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetAndClose = () => {
    setCancelData({
      reason: "",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <X className="h-5 w-5" />
            Cancel Appointment
          </DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">
                  {appointment.patient?.patientName}
                </span>
              </div>
              <p className="text-sm text-red-700">
                with {appointment.therapist?.name}
              </p>
              <p className="text-sm text-red-600 mt-1">
                Scheduled: {formatDate(appointment.appointmentStartTime)} at{" "}
                {formatTime(appointment.appointmentStartTime)}
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Cancelling this appointment will notify
                both the patient and therapist. This action cannot be undone.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancelReason">Reason for Cancellation *</Label>
              <Textarea
                id="cancelReason"
                placeholder="Please provide a reason for cancellation..."
                value={cancelData.reason}
                onChange={(e) =>
                  setCancelData({ ...cancelData, reason: e.target.value })
                }
                rows={3}
                required
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Keep Appointment
          </Button>
          <Button
            onClick={handleCancelAppointment}
            disabled={actionLoading || !cancelData.reason.trim()}
            variant="destructive"
          >
            {actionLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Cancelling...
              </div>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Cancel Appointment
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

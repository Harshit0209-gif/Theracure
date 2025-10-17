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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Edit, Save, User } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Appointment,
  DefaultEditAppointmentData,
  EditAppointmentData,
} from "@/types/appointments";
import { formatDate, formatTime } from "@/lib/utils/utils";
import { ServiceCategory } from "@/lib/generated/serviceEnums";
import { AllServiceCatagory, ServiceCategoryLabel } from "@/lib/service";
import { Service } from "@prisma/client";

interface EditAppointmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
}

export function EditAppointmentDialog({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}: EditAppointmentDialogProps) {
  const [editData, setEditData] = useState<EditAppointmentData>(
    DefaultEditAppointmentData
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory>();
  const [services, setServices] = useState<Service[]>([]);

  const fetchAllServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();

      if (!data.success) throw new Error("Failed to fetch services");

      setServices(data.data);
      const categories = Array.from(
        new Set(data.data.map((s: any) => s.category))
      );
      setServiceCategories(appointment?.service?.category);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (appointment && isOpen) {
      setEditData({
        serviceCatagory:
          appointment.service?.category || ServiceCategory.MANUAL_THERAPY,
        serviceName: appointment.service?.name || "",
        notes: appointment.notes || "",
      });
      fetchAllServices();
    }
  }, [appointment, isOpen]);

  const handleEditAppointment = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: services.find((s) => s.name === editData.serviceName)?.id,
          notes: editData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      toast({
        title: "Success",
        description: "Appointment details updated successfully",
      });

      onClose();
      onAppointmentUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment details",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const resetAndClose = () => {
    setEditData(DefaultEditAppointmentData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-indigo-600" />
            Edit Appointment Details
          </DialogTitle>
        </DialogHeader>

        {appointment && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-600" />
                <span className="font-medium">
                  {appointment.patient?.patientName}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                with {appointment.therapist?.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Scheduled: {formatDate(appointment.appointmentStartTime)} at{" "}
                {formatTime(appointment.appointmentStartTime)} -{" "}
                {formatTime(appointment.appointmentEndTime)}
              </p>
            </div>

            {/* Therapy Category */}
            <div className="space-y-2">
              <Label htmlFor="therapyCategory">Therapy Type</Label>
              <Select
                value={editData.serviceCatagory || ""}
                onValueChange={(value: ServiceCategory) =>
                  setEditData({
                    ...editData,
                    serviceCatagory: value,
                    serviceName: "",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {AllServiceCatagory.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {ServiceCategoryLabel[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Therapy Service */}
            <div className="space-y-2">
              <Label htmlFor="therapyType">Therapy Name</Label>
              <Select
                value={editData.serviceName || ""}
                onValueChange={(value) =>
                  setEditData({ ...editData, serviceName: value })
                }
                disabled={!editData.serviceCatagory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Therapy" />
                </SelectTrigger>
                <SelectContent>
                  {services
                    .filter((s) => s.category === editData.serviceCatagory)
                    .map((s) => (
                      <SelectItem key={s.name} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={editData.notes}
                onChange={(e) =>
                  setEditData({ ...editData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>
            Cancel
          </Button>
          <Button
            onClick={handleEditAppointment}
            disabled={actionLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {actionLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Updating...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Details
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

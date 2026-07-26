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
import { Edit, Save, User, Home } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Appointment,
  DefaultEditAppointmentData,
  EditAppointmentData,
} from "@/types/appointments";
import { formatDate, formatTime } from "@/lib/utils/utils";
import { MultiSelectServices } from "@/components/ui/multi-select-services";
import { Service } from "@prisma/client";

interface Cubicle {
  id: string;
  name: string;
  roomNumber?: string;
  location?: string;
  status: string;
}

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
  const [services, setServices] = useState<Service[]>([]);
  const [cubicles, setCubicles] = useState<Cubicle[]>([]);
  const [loadingCubicles, setLoadingCubicles] = useState(false);

  const fetchAllServices = async () => {
    try {
      const res = await fetch("/api/services");
      const data = await res.json();

      if (!data.success) throw new Error("Failed to fetch services");

      setServices(data.data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load services.",
        variant: "destructive",
      });
    }
  };

  const fetchCubicles = async () => {
    try {
      setLoadingCubicles(true);
      const res = await fetch("/api/cubicles");
      const data = await res.json();

      if (!data.success) throw new Error("Failed to fetch cubicles");

      // Filter only active cubicles
      const activeCubicles = data.cubicles.filter(
        (c: Cubicle) => c.status === "ACTIVE"
      );
      setCubicles(activeCubicles);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load cubicles.",
        variant: "destructive",
      });
    } finally {
      setLoadingCubicles(false);
    }
  };

  useEffect(() => {
    if (appointment && isOpen) {
      setEditData({
        serviceIds: appointment.services?.map((s) => s.id) || [],
        notes: appointment.notes || "",
        cubicleId: appointment.cubicleId || "",
      });
      fetchAllServices();
      fetchCubicles();
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
          serviceIds: editData.serviceIds,
          notes: editData.notes,
          cubicleId: editData.cubicleId || null,
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

            {/* Services */}
            <div className="space-y-2">
              <Label htmlFor="serviceIds">Services</Label>
              <MultiSelectServices
                services={services}
                selectedIds={editData.serviceIds}
                onChange={(ids) =>
                  setEditData({ ...editData, serviceIds: ids })
                }
                placeholder="Search and select services..."
              />
            </div>

            {/* Cubicle Selection */}
            <div className="space-y-2">
              <Label htmlFor="cubicle" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Cubicle / Room
              </Label>
              <Select
                value={editData.cubicleId || "no-cubicle"}
                onValueChange={(value) =>
                  setEditData({ ...editData, cubicleId: value === "no-cubicle" ? "" : value })
                }
                disabled={loadingCubicles}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingCubicles ? "Loading cubicles..." : "Select Cubicle"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-cubicle">No Cubicle</SelectItem>
                  {cubicles.map((cubicle) => (
                    <SelectItem key={cubicle.id} value={cubicle.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{cubicle.name}</span>
                        {(cubicle.roomNumber || cubicle.location) && (
                          <span className="text-xs text-gray-500">
                            {[cubicle.roomNumber, cubicle.location]
                              .filter(Boolean)
                              .join(" • ")}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {appointment?.cubicle && (
                <p className="text-xs text-gray-500">
                  Current: {appointment.cubicle.name}
                  {appointment.cubicle.roomNumber && ` (${appointment.cubicle.roomNumber})`}
                </p>
              )}
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

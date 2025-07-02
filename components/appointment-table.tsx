import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Accessibility,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Calendar,
  X,
  Clock,
  User,
  Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

interface Service {
  id: string;
  name: string;
  category: string;
  price: number;
}

export interface Appointment {
  id: string;
  therapistId: string;
  patientId: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  status: "confirmed" | "cancelled" | "completed";
  createdById: string;
  createdAt: string;
  notes?: string;

  service?: Service;

  patient?: {
    id: string;
    patientName: string;
  };
  therapist?: {
    id: string;
    name: string;
  };
  createdBy?: {
    name: string;
  };
}

export interface PaginationInfo {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

interface AppointmentTableProps {
  appointments: Appointment[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onAppointmentUpdated: () => void;
}

interface EditAppointmentData {
  therapyType: string;
  appointmentStartTime: string;
  appointmentEndTime: string;
  notes: string;
}

interface RescheduleData {
  appointmentStartTime: string;
  appointmentEndTime: string;
  reason: string;
}

interface CancelData {
  reason: string;
}

export function AppointmentTable({
  appointments,
  loading,
  searchQuery,
  setSearchQuery,
  pagination,
  onPageChange,
  onAppointmentUpdated,
}: AppointmentTableProps) {
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const isTherapist = user?.role === "therapist";
  const hasFullControl =
    user?.role === "admin" || user?.role === "receptionist";

  // Form states
  const [editData, setEditData] = useState<EditAppointmentData>({
    therapyType: "",
    appointmentStartTime: "",
    appointmentEndTime: "",
    notes: "",
  });

  const [rescheduleData, setRescheduleData] = useState<RescheduleData>({
    appointmentStartTime: "",
    appointmentEndTime: "",
    reason: "",
  });

  const [cancelData, setCancelData] = useState<CancelData>({
    reason: "",
  });

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

  const formatDateTimeForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    const statusLabels = {
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  // Reset forms when dialogs close
  const resetForms = () => {
    setEditData({
      therapyType: "",
      appointmentStartTime: "",
      appointmentEndTime: "",
      notes: "",
    });
    setRescheduleData({
      appointmentStartTime: "",
      appointmentEndTime: "",
      reason: "",
    });
    setCancelData({
      reason: "",
    });
    setSelectedAppointment(null);
  };

  // Open Edit Dialog
  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditData({
      therapyType: appointment.service?.name || "",
      appointmentStartTime: formatDateTimeForInput(
        appointment.appointmentStartTime
      ),
      appointmentEndTime: formatDateTimeForInput(
        appointment.appointmentEndTime
      ),
      notes: appointment.notes || "",
    });
    setEditDialogOpen(true);
  };

  // Open Reschedule Dialog
  const openRescheduleDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleData({
      appointmentStartTime: formatDateTimeForInput(
        appointment.appointmentStartTime
      ),
      appointmentEndTime: formatDateTimeForInput(
        appointment.appointmentEndTime
      ),
      reason: "",
    });
    setRescheduleDialogOpen(true);
  };

  // Open Cancel Dialog
  const openCancelDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelData({
      reason: "",
    });
    setCancelDialogOpen(true);
  };

  // Handle Edit Appointment
  const handleEditAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            therapyType: editData.therapyType,
            notes: editData.notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      toast({
        title: "Success",
        description: "Appointment details updated successfully",
      });

      setEditDialogOpen(false);
      resetForms();
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

  // Handle Reschedule Appointment
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}/reschedule`,
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

      setRescheduleDialogOpen(false);
      resetForms();
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

  // Handle Cancel Appointment
  const handleCancelAppointment = async () => {
    if (!selectedAppointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/appointments/${selectedAppointment.id}/cancel`,
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

      setCancelDialogOpen(false);
      resetForms();
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

  // Handle Status Update (Mark as Completed)
  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: string
  ) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment");
      }

      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });

      onAppointmentUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  // Validate time range
  const validateTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end;
  };

  if (loading) {
    return (
      <div className="bg-blue-200 rounded-lg p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading appointments...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-transparent rounded-lg overflow-hidden mb-6">
        {/* Search and Stats Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-0 mb-6">
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow min-w-[160px] justify-end">
            <Accessibility className="h-8 w-8 text-indigo-700" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-indigo-700">
                {pagination.total}
              </span>
              <span className="text-gray-700 text-sm">appointments</span>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by patient name"
                className="pl-10 pr-4 py-2 bg-white border border-indigo-300 rounded-lg w-full text-sm placeholder:text-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="text-white font-semibold">
                  Patient
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Therapist
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Date & Time
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Therapy Name
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Status
                </TableHead>
                <TableHead className="text-white font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    No appointments found.
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="border-b hover:bg-gray-50"
                  >
                    <TableCell className="font-medium bg-white">
                      <div>
                        <p>
                          {appointment.patient?.patientName ||
                            "Unknown Patient"}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {appointment.patientId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="bg-white">
                      {appointment.therapist?.name || "Unknown Therapist"}
                    </TableCell>
                    <TableCell className="bg-white">
                      <div>
                        <p className="font-medium">
                          {formatDate(appointment.appointmentStartTime)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {formatTime(appointment.appointmentStartTime)} -{" "}
                          {formatTime(appointment.appointmentEndTime)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="bg-white">
                      <p className="font-medium">
                        {appointment.service?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {appointment.service?.category || "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="bg-white">
                      {getStatusBadge(appointment.status)}
                    </TableCell>
                    <TableCell className="bg-white">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {appointment.status !== "cancelled" && (
                            <>
                              {hasFullControl && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => openEditDialog(appointment)}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Appointment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      openRescheduleDialog(appointment)
                                    }
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Reschedule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {appointment.status === "confirmed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          appointment.id,
                                          "completed"
                                        )
                                      }
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      openCancelDialog(appointment)
                                    }
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}

                              {isTherapist && (
                                <>
                                  {appointment.status === "confirmed" && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleStatusUpdate(
                                          appointment.id,
                                          "completed"
                                        )
                                      }
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      openCancelDialog(appointment)
                                    }
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}

                          {appointment.status === "cancelled" && (
                            <DropdownMenuItem disabled>
                              <X className="mr-2 h-4 w-4" />
                              Appointment Cancelled
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {appointments.length > 0 && (
          <div className="flex justify-between items-center p-4 bg-white border-t ">
            <span className="text-sm text-gray-700">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total} appointments
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === 1}
                onClick={() => onPageChange(pagination.page - 1)}
              >
                <ChevronLeft className="h-8 w-8" />
                Previous
              </Button>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (pg) => (
                  <Button
                    key={pg}
                    size="sm"
                    variant={pg === pagination.page ? "default" : "outline"}
                    className={
                      pg === pagination.page
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                        : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                    }
                    onClick={() => onPageChange(pg)}
                  >
                    {pg}
                  </Button>
                )
              )}

              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.page === pagination.pages}
                onClick={() => onPageChange(pagination.page + 1)}
              >
                Next
                <ChevronRight className="h-8 w-8" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Appointment Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-indigo-600" />
              Edit Appointment Details
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">
                    {selectedAppointment.patient?.patientName}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  with {selectedAppointment.therapist?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Scheduled:{" "}
                  {formatDate(selectedAppointment.appointmentStartTime)} at{" "}
                  {formatTime(selectedAppointment.appointmentStartTime)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="therapyType">Therapy Name</Label>
                <Select
                  value={editData.therapyType}
                  onValueChange={(value) =>
                    setEditData({ ...editData, therapyType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select therapy type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physical Therapy">
                      Physical Therapy
                    </SelectItem>
                    <SelectItem value="Occupational Therapy">
                      Occupational Therapy
                    </SelectItem>
                    <SelectItem value="Speech Therapy">
                      Speech Therapy
                    </SelectItem>
                    <SelectItem value="Massage Therapy">
                      Massage Therapy
                    </SelectItem>
                    <SelectItem value="Sports Rehabilitation">
                      Sports Rehabilitation
                    </SelectItem>
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
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                resetForms();
              }}
            >
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

      {/* Reschedule Appointment Dialog */}
      <Dialog
        open={rescheduleDialogOpen}
        onOpenChange={setRescheduleDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Reschedule Appointment Time
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="font-medium">
                    {selectedAppointment.patient?.patientName}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  with {selectedAppointment.therapist?.name}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Current:{" "}
                  {formatDate(selectedAppointment.appointmentStartTime)} at{" "}
                  {formatTime(selectedAppointment.appointmentStartTime)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rescheduleStartTime">
                    New Start Date & Time
                  </Label>
                  <Input
                    id="rescheduleStartTime"
                    type="datetime-local"
                    value={rescheduleData.appointmentStartTime}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        appointmentStartTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rescheduleEndTime">New End Date & Time</Label>
                  <Input
                    id="rescheduleEndTime"
                    type="datetime-local"
                    value={rescheduleData.appointmentEndTime}
                    onChange={(e) =>
                      setRescheduleData({
                        ...rescheduleData,
                        appointmentEndTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rescheduleReason">
                  Reason for Rescheduling *
                </Label>
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
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleDialogOpen(false);
                resetForms();
              }}
            >
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
                  <Calendar className="h-4 w-4 mr-2" />
                  Reschedule Time
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Appointment Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Cancel Appointment
            </DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">
                    {selectedAppointment.patient?.patientName}
                  </span>
                </div>
                <p className="text-sm text-red-700">
                  with {selectedAppointment.therapist?.name}
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Scheduled:{" "}
                  {formatDate(selectedAppointment.appointmentStartTime)} at{" "}
                  {formatTime(selectedAppointment.appointmentStartTime)}
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
            <Button
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                resetForms();
              }}
            >
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
    </>
  );
}

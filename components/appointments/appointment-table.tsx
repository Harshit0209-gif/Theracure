import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Accessibility,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Edit,
  Calendar,
  X,
  Clock,
  Eye,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { statusLabels, statusStyles } from "@/lib/appointment";
import { Appointment, AppointmentTableProps } from "@/types/appointments";
import { ServiceCategoryLabel } from "@/lib/service";
import { EditAppointmentDialog } from "@/components/appointments/EditAppointment";
import { RescheduleAppointmentDialog } from "@/components/appointments/RescheduleAppointment";
import { CancelAppointmentDialog } from "@/components/appointments/CancelAppointment";
import { AppointmentDetailsDialog } from "@/components/appointments/AppointmentDetails";
import { formatDate, formatTime } from "@/lib/utils/utils";

export function AppointmentTable({
  appointments,
  loading,
  pagination,
  onPageChange,
  onAppointmentUpdated,
  therapyTypeFilter,
}: AppointmentTableProps) {
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);

  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;
  const hasFullControl =
    user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTIONIST;

  const filteredAppointments = useMemo(
    () =>
      therapyTypeFilter === "all"
        ? appointments
        : appointments.filter((a) => a.service?.category === therapyTypeFilter),
    [appointments, therapyTypeFilter]
  );

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  // Dialog open handlers
  const openEditDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setEditDialogOpen(true);
  }, []);

  const openRescheduleDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleDialogOpen(true);
  }, []);

  const openCancelDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setCancelDialogOpen(true);
  }, []);

  const openDetailsDialog = useCallback((appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsDialogOpen(true);
  }, []);

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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-0 mb-6">
          <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow min-w-[160px] justify-end">
            <Accessibility className="h-8 w-8 text-indigo-700" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-indigo-700">
                {filteredAppointments.length}
              </span>
              <span className="text-gray-700 text-sm">appointments</span>
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
              {filteredAppointments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    {therapyTypeFilter !== "all"
                      ? `No appointments found for ${
                          ServiceCategoryLabel[
                            therapyTypeFilter as keyof typeof ServiceCategoryLabel
                          ]
                        }.`
                      : "No appointments found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map((appointment: Appointment) => (
                  <TableRow
                    key={appointment.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    onClick={() => openDetailsDialog(appointment)}
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
                        {(appointment.service?.category &&
                          ServiceCategoryLabel[appointment.service.category]) ||
                          "N/A"}
                      </p>
                    </TableCell>
                    <TableCell className="bg-white">
                      {getStatusBadge(appointment.status)}
                    </TableCell>
                    <TableCell className="bg-white">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              openDetailsDialog(appointment);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          {appointment.status !==
                            AppointmentStatus.CANCELLED && (
                            <>
                              {hasFullControl && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(appointment);
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Appointment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openRescheduleDialog(appointment);
                                    }}
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Reschedule
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  {appointment.status ===
                                    AppointmentStatus.CONFIRMED && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(
                                          appointment.id,
                                          AppointmentStatus.COMPLETED
                                        );
                                      }}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCancelDialog(appointment);
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}

                              {isTherapist && (
                                <>
                                  <DropdownMenuSeparator />
                                  {appointment.status ===
                                    AppointmentStatus.CONFIRMED && (
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(
                                          appointment.id,
                                          AppointmentStatus.COMPLETED
                                        );
                                      }}
                                    >
                                      <Clock className="mr-2 h-4 w-4" />
                                      Mark as Completed
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openCancelDialog(appointment);
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Cancel Appointment
                                  </DropdownMenuItem>
                                </>
                              )}
                            </>
                          )}

                          {appointment.status ===
                            AppointmentStatus.CANCELLED && (
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
        {filteredAppointments.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-t gap-4">
            <span className="text-sm text-gray-700 text-center sm:text-left">
              Showing{" "}
              {Math.min(
                filteredAppointments.length,
                (pagination.currentPage - 1) * pagination.limit + 1
              )}{" "}
              to{" "}
              {Math.min(
                pagination.currentPage * pagination.limit,
                filteredAppointments.length
              )}{" "}
              of {filteredAppointments.length} appointments
            </span>
            <div className="flex gap-2 items-center flex-wrap justify-center">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.currentPage === 1}
                onClick={() => onPageChange(pagination.currentPage - 1)}
              >
                <ChevronLeft className="h-4 w-4 sm:h-8 sm:w-8" />
                <span className="hidden sm:inline">Previous</span>
              </Button>

              {Array.from(
                { length: Math.min(pagination.totalPages, 5) },
                (_, i) => {
                  const pageNumber =
                    i + Math.max(1, pagination.currentPage - 2);
                  return pageNumber <= pagination.totalPages ? (
                    <Button
                      key={pageNumber}
                      size="sm"
                      variant={
                        pageNumber === pagination.currentPage
                          ? "default"
                          : "outline"
                      }
                      className={
                        pageNumber === pagination.currentPage
                          ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                          : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                      }
                      onClick={() => onPageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ) : null;
                }
              )}

              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => onPageChange(pagination.currentPage + 1)}
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4 sm:h-8 sm:w-8" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* All Dialog Components */}
      <AppointmentDetailsDialog
        isOpen={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        appointment={selectedAppointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      <EditAppointmentDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        appointment={selectedAppointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      <RescheduleAppointmentDialog
        isOpen={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        appointment={selectedAppointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      <CancelAppointmentDialog
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        appointment={selectedAppointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />
    </>
  );
}

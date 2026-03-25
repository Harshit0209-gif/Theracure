import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import {
  CalendarClock,
  MoreHorizontal,
  Edit,
  Calendar,
  X,
  Clock,
  Eye,
  Mail,
  MessageCircle,
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
  page,
  pageSize,
  totalPages,
  totalCount,
  therapyTypeFilter,
  setPage,
  setPageSize,
  onAppointmentUpdated,
}: AppointmentTableProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;
  const hasFullControl = user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTIONIST;

  const filteredAppointments = useMemo(
    () =>
      therapyTypeFilter === "all"
        ? appointments
        : appointments.filter((a) => a.service?.category === therapyTypeFilter),
    [appointments, therapyTypeFilter]
  );

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

  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update appointment");
      toast({ title: "Success", description: "Appointment status updated successfully" });
      onAppointmentUpdated();
    } catch {
      toast({ title: "Error", description: "Failed to update appointment status", variant: "destructive" });
    }
  };

  const handleSendReminder = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send reminder");
      toast({ title: "Success", description: data.message || "Reminder SMS sent successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reminder SMS",
        variant: "destructive",
      });
    }
  };

  const handleSendFeedback = async (appointmentId: string) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}/send-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send feedback SMS");
      toast({ title: "Success", description: data.message || "Feedback SMS sent successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send feedback SMS",
        variant: "destructive",
      });
    }
  };

  const columns: DataTableColumn<Appointment>[] = [
    {
      header: "#",
      headerClassName: "w-14 text-center",
      cellClassName: "text-center text-sm text-gray-400 font-medium",
      cell: (_, index) => index + 1,
    },
    {
      header: "Patient",
      cell: (appt) => (
        <>
          <div className="font-semibold text-gray-800">
            {appt.patient?.patientName || "Unknown Patient"}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">{appt.patientId}</div>
        </>
      ),
    },
    {
      header: "Therapist",
      cellClassName: "text-gray-700",
      cell: (appt) => appt.therapist?.name || <span className="text-gray-400">—</span>,
    },
    {
      header: "Date & Time",
      cell: (appt) => (
        <>
          <div className="font-medium text-gray-800">{formatDate(appt.appointmentStartTime)}</div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatTime(appt.appointmentStartTime)} – {formatTime(appt.appointmentEndTime)}
          </div>
        </>
      ),
    },
    {
      header: "Therapy",
      cell: (appt) => (
        <>
          <div className="font-medium text-gray-800">
            {appt.service?.name || <span className="text-gray-400">—</span>}
          </div>
          {appt.service?.category && (
            <div className="text-xs text-gray-400 mt-0.5">
              {ServiceCategoryLabel[appt.service.category]}
            </div>
          )}
        </>
      ),
    },
    {
      header: "Cubicle",
      cell: (appt) =>
        appt.cubicle ? (
          <>
            <div className="font-medium text-indigo-700">{appt.cubicle.name}</div>
            {appt.cubicle.roomNumber && (
              <div className="text-xs text-gray-400 mt-0.5">
                {appt.cubicle.roomNumber}
                {appt.cubicle.location && ` · ${appt.cubicle.location}`}
              </div>
            )}
          </>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (appt) => (
        <Badge className={statusStyles[appt.status as keyof typeof statusStyles]}>
          {statusLabels[appt.status as keyof typeof statusLabels]}
        </Badge>
      ),
    },
    {
      header: "Actions",
      headerClassName: "text-right pr-6",
      cellClassName: "text-right pr-4",
      cell: (appt) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openDetailsDialog(appt); }}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            {appt.status === AppointmentStatus.COMPLETED && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleSendFeedback(appt.id); }}
                  className="text-green-600"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Feedback SMS
                </DropdownMenuItem>
              </>
            )}

            {(appt.status === AppointmentStatus.CONFIRMED ||
              appt.status === AppointmentStatus.CANCELLED ||
              appt.status === AppointmentStatus.RESCHEDULED) && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => { e.stopPropagation(); handleSendReminder(appt.id); }}
                  className="text-blue-600"
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Send Reminder SMS
                </DropdownMenuItem>
              </>
            )}

            {appt.status !== AppointmentStatus.CANCELLED && (
              <>
                {hasFullControl && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditDialog(appt); }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Appointment
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openRescheduleDialog(appt); }}>
                      <Calendar className="mr-2 h-4 w-4" />
                      Reschedule
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {appt.status === AppointmentStatus.CONFIRMED && (
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appt.id, AppointmentStatus.COMPLETED); }}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => { e.stopPropagation(); openCancelDialog(appt); }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Appointment
                    </DropdownMenuItem>
                  </>
                )}

                {isTherapist && (
                  <>
                    <DropdownMenuSeparator />
                    {appt.status === AppointmentStatus.CONFIRMED && (
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(appt.id, AppointmentStatus.COMPLETED); }}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        Mark as Completed
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={(e) => { e.stopPropagation(); openCancelDialog(appt); }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Appointment
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}

            {appt.status === AppointmentStatus.CANCELLED && (
              <DropdownMenuItem disabled>
                <X className="mr-2 h-4 w-4" />
                Appointment Cancelled
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={filteredAppointments}
        rowKey={(a) => a.id}
        page={page}
        pageSize={pageSize}
        totalPages={totalPages}
        totalCount={totalCount}
        setPage={setPage}
        setPageSize={setPageSize}
        loading={loading}
        countIcon={<CalendarClock className="h-5 w-5" />}
        countLabel="appointments"
        emptyIcon={<Calendar className="h-10 w-10" />}
        emptyTitle="No appointments found"
        emptyDescription={
          therapyTypeFilter !== "all"
            ? `No appointments for ${ServiceCategoryLabel[therapyTypeFilter as keyof typeof ServiceCategoryLabel]}`
            : "No appointments scheduled yet"
        }
        onRowClick={openDetailsDialog}
        className="mb-6"
      />

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

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search,
  Filter,
} from "lucide-react";
import { AllServiceCatagory } from "@/lib/service";
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
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";

const VIEW_TABS = [
  { label: "Today", value: "today", title: "Current day only" },
  { label: "Upcoming", value: "upcoming", title: "Today and future" },
  { label: "All", value: "all", title: "Full history" },
] as const;

export function AppointmentTable({
  appointments,
  loading,
  page,
  pageSize,
  totalPages,
  totalCount,
  searchQuery,
  setSearchQuery,
  therapyTypeFilter,
  setTherapyTypeFilter,
  setPage,
  setPageSize,
  onAppointmentUpdated,
  view,
  onViewChange,
  dateFilter,
  onDateFilterChange,
}: AppointmentTableProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const { user } = useAuth();
  const isTherapist = user?.role === UserRole.THERAPIST;
  const hasFullControl =
    user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTIONIST;

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

  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: string,
  ) => {
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update appointment");
      toast({
        title: "Success",
        description: "Appointment status updated successfully",
      });
      onAppointmentUpdated();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/send-reminder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to send reminder");
      toast({
        title: "Success",
        description: data.message || "Reminder SMS sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send reminder SMS",
        variant: "destructive",
      });
    }
  };

  const handleSendFeedback = async (appointmentId: string) => {
    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}/send-feedback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
      );
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to send feedback SMS");
      toast({
        title: "Success",
        description: data.message || "Feedback SMS sent successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to send feedback SMS",
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
      cell: (appt) =>
        appt.therapist?.name || <span className="text-gray-400">—</span>,
    },
    {
      header: "Date & Time",
      cell: (appt) => (
        <>
          <div className="font-medium text-gray-800">
            {formatDate(appt.appointmentStartTime)}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {formatTime(appt.appointmentStartTime)} –{" "}
            {formatTime(appt.appointmentEndTime)}
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
            <div className="font-medium text-indigo-700">
              {appt.cubicle.name}
            </div>
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
        <Badge
          className={statusStyles[appt.status as keyof typeof statusStyles]}
        >
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
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                openDetailsDialog(appt);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {appt.status === AppointmentStatus.COMPLETED && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSendFeedback(appt.id);
                  }}
                  className="text-green-600"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send Feedback SMS
                </DropdownMenuItem>
              </>
            )}

            {(appt.status === AppointmentStatus.CONFIRMED ||
              appt.status === AppointmentStatus.RESCHEDULED) &&
              (() => {
                const apptPast =
                  new Date(appt.appointmentStartTime) <= new Date();
                return (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendReminder(appt.id);
                      }}
                      className="text-blue-600"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reminder SMS
                    </DropdownMenuItem>

                    {hasFullControl && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditDialog(appt);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Appointment
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            openRescheduleDialog(appt);
                          }}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={!apptPast}
                          title={
                            !apptPast
                              ? "Cannot complete before appointment time"
                              : undefined
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusUpdate(
                              appt.id,
                              AppointmentStatus.COMPLETED,
                            );
                          }}
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Mark as Completed
                        </DropdownMenuItem>

                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCancelDialog(appt);
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
                        {appt.status === AppointmentStatus.CONFIRMED && (
                          <DropdownMenuItem
                            disabled={!apptPast}
                            title={
                              !apptPast
                                ? "Cannot complete before appointment time"
                                : undefined
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusUpdate(
                                appt.id,
                                AppointmentStatus.COMPLETED,
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
                            openCancelDialog(appt);
                          }}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Cancel Appointment
                        </DropdownMenuItem>
                      </>
                    )}
                  </>
                );
              })()}

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

  const formattedDateFilter = dateFilter
    ? new Date(dateFilter + "T00:00:00").toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  return (
    <>
      <div className="grid grid-cols-3 items-center bg-white border border-b-0 border-gray-200 rounded-t-xl px-4 py-2 shadow-sm">
        <div className="flex items-center">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.value}
              title={tab.title}
              onClick={() => {
                onDateFilterChange("");
                onViewChange(tab.value);
              }}
              className={`relative flex items-center px-4 py-2.5 text-sm font-medium transition-all duration-150 select-none ${
                dateFilter
                  ? "text-gray-300 hover:text-gray-400"
                  : view === tab.value
                    ? "text-indigo-700 font-semibold"
                    : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
              {!dateFilter && view === tab.value && (
                <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t-full bg-indigo-600" />
              )}
            </button>
          ))}
        </div>

        {/* Center: expanding search */}
        <div className="flex justify-center">
          <div className="relative group w-80 focus-within:w-[480px] transition-all duration-300">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
            <Input
              type="text"
              placeholder="Search patient..."
              value={searchQuery ?? ""}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-[34px] pl-9 pr-8 w-full text-sm bg-white border-gray-300 focus:border-indigo-400 rounded-md shadow-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right: therapy filter + date filter */}
        <div className="flex items-center justify-end gap-2">
          {/* Therapy filter */}
          <Select
            value={therapyTypeFilter}
            onValueChange={setTherapyTypeFilter}
          >
            <SelectTrigger className="h-[34px] w-auto min-w-[130px] max-w-[180px] text-sm bg-white border-gray-300 shadow-sm rounded-md">
              <div className="flex items-center gap-1.5 min-w-0">
                <Filter className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="truncate whitespace-nowrap">
                  <SelectValue placeholder="All Therapies" />
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="min-w-[180px]">
              <SelectItem value="all">All Therapies</SelectItem>
              {AllServiceCatagory.map((type) => (
                <SelectItem key={type} value={type}>
                  {ServiceCategoryLabel[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Divider */}
          <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

          {/* Date filter */}
          {dateFilter ? (
            <div className="flex items-stretch h-[34px] rounded-md overflow-hidden ring-1 ring-indigo-400 shadow-sm">
              <button
                onClick={() => setDatePickerOpen(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium pl-3 pr-2.5 transition-colors"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded bg-indigo-500/60">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                </span>
                <span>{formattedDateFilter}</span>
              </button>
              <button
                onClick={() => onDateFilterChange("")}
                title="Clear date filter"
                className="flex items-center justify-center w-8 bg-indigo-600 hover:bg-red-500 text-indigo-200 hover:text-white border-l border-indigo-500/50 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDatePickerOpen(true)}
              title="Filter by specific date"
              className="group flex items-center gap-2 h-[34px] bg-white border border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 text-gray-600 hover:text-indigo-700 text-sm font-medium pl-2.5 pr-3.5 rounded-md shadow-sm transition-all duration-150"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded bg-gray-100 group-hover:bg-indigo-100 transition-colors">
                <Calendar className="h-3 w-3 text-gray-500 group-hover:text-indigo-600 transition-colors" />
              </span>
              <span>Filter by Date</span>
            </button>
          )}
        </div>
      </div>

      <DatePickerDialog
        open={datePickerOpen}
        onOpenChange={setDatePickerOpen}
        value={dateFilter}
        onChange={(d) => {
          onDateFilterChange(d);
          setDatePickerOpen(false);
        }}
        title="Filter by Date"
        disablePast={false}
      />

      <DataTable
        columns={columns}
        data={appointments}
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
        className="mb-6 rounded-t-none border-t-0"
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

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  Edit,
  Calendar,
  User,
  Clock,
  MapPin,
  FileText,
  FileEdit,
  IndianRupee,
  Printer,
  Save,
  Home,
  Loader2,
  Receipt,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Appointment } from "@/types/appointments";
import { statusLabels, statusStyles } from "@/lib/appointment";
import { ServiceCategoryLabel } from "@/lib/service";
import { EditAppointmentDialog } from "@/components/appointments/EditAppointment";
import { RescheduleAppointmentDialog } from "@/components/appointments/RescheduleAppointment";
import { useAuth } from "@/contexts/auth-context";
import { UserRole } from "@/lib/generated/userRoles";
import { AppointmentStatus } from "@/lib/generated/bookingEnums";
import { InvoiceDetailsModal } from "@/components/invoices/InvoiceModel";
import { PaymentDialog } from "@/components/invoices/PaymentDialog";
import { DraftInvoiceEditDialog } from "@/components/invoices/DraftInvoiceEditDialog";
import { mapInvoiceToPrintPayload } from "@/lib/utils/invoiceUtils";
import {
  InvoicePayload,
  PaymentStatus,
  invoiceStatusLabelMap,
  invoiceStatusStyles,
} from "@/types/invoice";

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onAppointmentUpdated: () => void;
}

export function AppointmentDetailsDialog({
  isOpen,
  onClose,
  appointment,
  onAppointmentUpdated,
}: AppointmentDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [isEditingDateTime, setIsEditingDateTime] = useState(false);
  const [editingDateTime, setEditingDateTime] = useState({
    startTime: "",
    endTime: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuth();
  const hasFullControl =
    user?.role === UserRole.ADMIN || user?.role === UserRole.RECEPTIONIST;

  const [invoiceDetail, setInvoiceDetail] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceViewOpen, setInvoiceViewOpen] = useState(false);
  const [invoicePrintPayload, setInvoicePrintPayload] =
    useState<InvoicePayload | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [draftEditOpen, setDraftEditOpen] = useState(false);

  useEffect(() => {
    if (isOpen && appointment?.invoice) {
      setInvoiceLoading(true);
      fetch(`/api/invoices/${appointment.invoice.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInvoiceDetail(data.data);
        })
        .catch(() => {})
        .finally(() => setInvoiceLoading(false));
    } else {
      setInvoiceDetail(null);
    }
  }, [isOpen, appointment?.invoice?.id]);

  const refreshInvoiceDetail = () => {
    if (!appointment?.invoice) return;
    fetch(`/api/invoices/${appointment.invoice.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setInvoiceDetail(data.data);
      })
      .catch(() => {});
    onAppointmentUpdated();
  };

  const handleViewInvoice = () => {
    if (!invoiceDetail) return;
    const payload = mapInvoiceToPrintPayload(invoiceDetail, {
      totalAmount: invoiceDetail.totalAmount,
      amountPaid: invoiceDetail.amountPaid,
      subTotal: invoiceDetail.subTotal,
      offer: invoiceDetail.offer || 0,
      discount: 0,
      balance: invoiceDetail.totalAmount - invoiceDetail.amountPaid,
      status: PaymentStatus.PENDING,
    });
    setInvoicePrintPayload(payload);
    setInvoiceViewOpen(true);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
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
    return (
      <Badge className={statusStyles[status as keyof typeof statusStyles]}>
        {statusLabels[status as keyof typeof statusLabels]}
      </Badge>
    );
  };

  const handleEditDateTime = () => {
    if (!appointment) return;
    setEditingDateTime({
      startTime: formatDateTimeForInput(appointment.appointmentStartTime),
      endTime: formatDateTimeForInput(appointment.appointmentEndTime),
    });
    setIsEditingDateTime(true);
  };

  const handleSaveDateTime = async () => {
    if (!appointment) return;

    try {
      setActionLoading(true);

      const response = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentStartTime: new Date(
            editingDateTime.startTime
          ).toISOString(),
          appointmentEndTime: new Date(editingDateTime.endTime).toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update appointment time");
      }

      toast({
        title: "Success",
        description: "Appointment time updated successfully",
      });

      setIsEditingDateTime(false);
      onAppointmentUpdated();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment time",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const validateTimeRange = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return start < end;
  };

  if (!appointment) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xlg">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
              <Eye className="h-5 w-5 text-indigo-600" />
              Appointment Details
            </DialogTitle>

            {hasFullControl &&
              appointment.status !== AppointmentStatus.CANCELLED &&
              appointment.status !== AppointmentStatus.COMPLETED && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditDialogOpen(true)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <Calendar className="h-4 w-4" />
                    Reschedule
                  </Button>
                </div>
              )}
          </DialogHeader>

          <Tabs defaultValue="details" className="mt-4">
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="billing">Billing & Invoice</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
          <div className="space-y-6 mt-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Status</span>
              {getStatusBadge(appointment.status)}
            </div>

            {/* Patient + Therapist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Patient</p>
                <p className="font-medium">
                  {appointment.patient?.patientName || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Therapist</p>
                <p className="font-medium">
                  {appointment.therapist?.name || "Unknown"}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="border rounded-md p-3 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                Date & Time
              </h3>
              <p className="text-sm text-gray-800">
                {formatDate(appointment.appointmentStartTime)}
              </p>
              <p className="text-sm font-medium">
                {formatTime(appointment.appointmentStartTime)} –{" "}
                {formatTime(appointment.appointmentEndTime)}
              </p>
            </div>

            {/* Services */}
            <div className="text-sm">
              <p className="text-gray-500 mb-1">
                {appointment.services && appointment.services.length > 1
                  ? "Services"
                  : "Service"}
              </p>
              {appointment.services && appointment.services.length > 0 ? (
                <div className="space-y-1.5">
                  {appointment.services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <p className="font-medium">
                        {service.name} (
                        {ServiceCategoryLabel[service.category]})
                      </p>
                      <Badge
                        variant="secondary"
                        className={statusStyles[appointment.status]}
                      >
                        {statusLabels[appointment.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-medium">N/A</p>
              )}
            </div>

            {/* Cubicle Information */}
            <div className="border rounded-md p-3 bg-indigo-50">
              <h3 className="text-sm font-semibold text-indigo-700 mb-2 flex items-center gap-2">
                <Home className="h-4 w-4 text-indigo-600" />
                Assigned Cubicle / Room
              </h3>
              {appointment.cubicle ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-indigo-900">
                    {appointment.cubicle.name}
                  </p>
                  {appointment.cubicle.roomNumber && (
                    <p className="text-xs text-indigo-600 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Room: {appointment.cubicle.roomNumber}
                    </p>
                  )}
                  {appointment.cubicle.location && (
                    <p className="text-xs text-indigo-600">
                      Location: {appointment.cubicle.location}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">
                  No cubicle assigned
                </p>
              )}
            </div>

            {/* Notes */}
            {appointment.notes && (
              <div className="text-sm">
                <p className="text-gray-500">Notes</p>
                <p>{appointment.notes}</p>
              </div>
            )}

            {/* ID */}
            <p className="text-xs text-gray-400 text-center">
              Appointment ID: {appointment.id}
            </p>
          </div>
            </TabsContent>

            <TabsContent value="billing">
              <div className="space-y-4 mt-4">
                {invoiceLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                  </div>
                ) : invoiceDetail ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Invoice Number</p>
                        <p className="font-medium">{invoiceDetail.id}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Invoice Status</p>
                        <Badge
                          className={
                            invoiceStatusStyles[invoiceDetail.status]?.color
                          }
                        >
                          {invoiceStatusLabelMap[invoiceDetail.status] ||
                            invoiceDetail.status}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-medium">
                          ₹{invoiceDetail.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Balance Due</p>
                        <p className="font-medium">
                          ₹
                          {(
                            invoiceDetail.totalAmount - invoiceDetail.amountPaid
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-green-600" />
                        Payment History
                      </h3>
                      {invoiceDetail.transactions?.length > 0 ? (
                        <div className="space-y-1.5">
                          {invoiceDetail.transactions.map((txn: any) => (
                            <div
                              key={txn.id}
                              className="flex items-center justify-between text-xs border rounded-md p-2 bg-gray-50"
                            >
                              <span className="text-gray-500">
                                {new Date(
                                  txn.transactionDate,
                                ).toLocaleDateString("en-IN")}
                              </span>
                              <span className="text-gray-600">
                                {txn.paymentMethod}
                              </span>
                              <span className="font-medium">
                                ₹{txn.amount.toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">
                          No payments recorded
                        </p>
                      )}
                    </div>

                    {hasFullControl && (
                      <div className="flex gap-2 flex-wrap pt-3 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleViewInvoice}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {invoiceDetail.status === "DRAFT" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDraftEditOpen(true)}
                          >
                            <FileEdit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        {invoiceDetail.status !== "PAID" &&
                          invoiceDetail.status !== "CANCELLED" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPaymentDialogOpen(true)}
                            >
                              <IndianRupee className="h-4 w-4 mr-1" />
                              Collect Payment
                            </Button>
                          )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            window.open(
                              `/api/invoices/${invoiceDetail.id}/pdf`,
                              "_blank",
                            )
                          }
                        >
                          <Printer className="h-4 w-4 mr-1" />
                          Print
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400 italic text-center py-8">
                    No invoice linked to this appointment
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditAppointmentDialog
        isOpen={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        appointment={appointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      {/* Reschedule Dialog */}
      <RescheduleAppointmentDialog
        isOpen={rescheduleDialogOpen}
        onClose={() => setRescheduleDialogOpen(false)}
        appointment={appointment}
        onAppointmentUpdated={onAppointmentUpdated}
      />

      {/* Billing & Invoice dialogs */}
      <InvoiceDetailsModal
        printPayload={invoicePrintPayload}
        isDetailsModalOpen={invoiceViewOpen}
        setIsDetailsModalOpen={setInvoiceViewOpen}
        handlePrintInvoice={() =>
          invoiceDetail &&
          window.open(`/api/invoices/${invoiceDetail.id}/pdf`, "_blank")
        }
        onPaymentSuccess={refreshInvoiceDetail}
      />
      {invoiceDetail && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          invoice={{
            id: invoiceDetail.id,
            totalAmount: invoiceDetail.totalAmount,
            amountPaid: invoiceDetail.amountPaid,
            patient: {
              patientName: appointment.patient?.patientName || "",
            },
          }}
          onPaymentSuccess={() => {
            setPaymentDialogOpen(false);
            refreshInvoiceDetail();
          }}
        />
      )}
      <DraftInvoiceEditDialog
        isOpen={draftEditOpen}
        onClose={() => setDraftEditOpen(false)}
        invoiceId={invoiceDetail?.id ?? null}
        onUpdated={refreshInvoiceDetail}
      />
    </>
  );
}

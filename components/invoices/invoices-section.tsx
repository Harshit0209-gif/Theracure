import { useMemo, useState } from "react";
import {
  Plus,
  CreditCard,
  Clock,
  Download,
  Printer,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Save,
  Calculator,
  User,
  Phone,
  MapPin,
  Trash2,
  FileText,
  CheckCircle,
  Check,
  Minus,
  Activity,
  Stethoscope,
  Mail,
  Search,
  XCircle,
  HandMetal,
  Zap,
  Dumbbell,
  Loader2,
  Eye,
  Send,
  IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { debounce } from "lodash";
import { useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { generateInvoiceId } from "@/lib/utils/RandomIDGenerator";
import {
  calculateSubtotal,
  calculateTotal,
  calculateBalance,
  calculateDiscount,
  isPrintable,
  mapInvoiceToPayload,
} from "@/lib/utils/invoiceUtils";

import { validateInvoice } from "@/lib/validations/invoiceValidator";
import { saveInvoice, printInvoice } from "@/lib/utils/invoiceApi";

import {
  Service,
  Invoice,
  PatientInfo,
  PaymentDetails,
  InvoiceDetails,
  InvoicePayload,
} from "@/types/invoice";

export function InvoicesSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(invoices.length / pageSize);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] =
    useState<Invoice>();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [printPayload, setPrintPayload] = useState<InvoicePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    patientName: "",
    id: "",
    phone: "",
    address: "",
    email: "",
  });

  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    invoiceId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    createdBy: "system",
  });

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    totalAmount: 0,
    amountPaid: 0,
    subTotal: 0,
    offer: 0,
    balance: 0,
    discount: 0,
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split("T")[0],
    status: "",
  });

  const fetchServices = useCallback(async () => {
    setIsServicesLoading(true);
    try {
      const response = await fetch("/api/services");
      const data = await response.json();
      setServices(data.data);
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setIsServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInvoiceDialogOpen) {
      fetchServices();
    }
  }, [isInvoiceDialogOpen, fetchServices]);

  const fetchPatientDetails = useCallback(
    async (id: string) => {
      setIsSearching(true);

      try {
        const response = await fetch(`/api/patients/${id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setPatientFound(true);
          setPatientInfo(data.patient);
        } else {
          setPatientFound(false);
          setPatientInfo((prev) => ({
            ...prev,
            patientName: "",
            phone: "",
            address: "",
            email: "",
          }));
        }
      } catch (error) {
        console.error("Error fetching patient details:", error);
        setPatientFound(false);
        toast({
          title: "Error",
          description: "Failed to fetch patient details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsSearching(false);
      }
    },
    [toast]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((id: string) => {
        if (id.length >= 6) {
          fetchPatientDetails(id);
        } else {
          setPatientFound(false);
          setPatientInfo((prev) => ({
            ...prev,
            patientName: "",
            phone: "",
            address: "",
            email: "",
          }));
        }
      }, 500),
    [fetchPatientDetails]
  );

  const handleidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientInfo((prev) => ({ ...prev, id: value }));
    debouncedSearch(value);
  };

  const addService = (service: Service) => {
    const existingService = selectedServices.find((s) => s.id === service.id);
    if (existingService) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s
        )
      );
    } else {
      setSelectedServices([...selectedServices, { ...service, quantity: 1 }]);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity <= 0) {
      removeService(serviceId);
    } else {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === serviceId ? { ...s, quantity } : s
        )
      );
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices?.filter((s) => s.id !== serviceId));
  };

  const openInvoiceDialog = () => {
    setInvoiceDetails({
      ...invoiceDetails,
      invoiceId: generateInvoiceId(),
    });
    setIsInvoiceDialogOpen(true);
  };

  const closeInvoiceDialog = () => {
    setIsInvoiceDialogOpen(false);
    setSelectedServices([]);
    setPatientInfo({
      patientName: "",
      id: "",
      phone: "",
      address: "",
      email: "",
    });
    setInvoiceDetails({
      invoiceId: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
      createdBy: "",
    });
    setPaymentDetails({
      totalAmount: 0,
      amountPaid: 0,
      offer: 0,
      subTotal: 0,
      balance: 0,
      discount: 0,
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split("T")[0],
      status: "",
    });
  };

  const invoicePayload: InvoicePayload = {
    invoiceDetails,
    patientInfo,
    paymentDetails,
    selectedServices,
    createdBy: user?.email,
    type: "invoice",
  };

  const handleSaveInvoice = async () => {
    const isValid = validateInvoice({
      patientInfo,
      selectedServices,
      paymentDetails,
      invoiceDetails,
      user,
      toast,
    });
    if (!isValid) return;

    const invoicePayload: InvoicePayload = {
      invoiceDetails,
      patientInfo,
      paymentDetails,
      selectedServices,
      createdBy: user?.email,
      type: "invoice",
    };

    const result = await saveInvoice(invoicePayload);
    if (result.success) {
      const { invoice, selectedServices } = result.data;
      setInvoices((prev) => [
        {
          ...invoice,
          invoiceItems: selectedServices.map((i: Service) => ({
            serviceId: i.id,
            quantity: i.quantity,
            priceAtPurchase: i.price,
            description: i.description,
            category: i.category,
          })),
        },
        ...prev,
      ]);
      setPage(1);
      toast({ title: "Invoice Created", description: "Successfully created." });
      closeInvoiceDialog();
    } else {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await fetch("/api/invoices");
      const data = await response.json();
      if (response.ok && data.success) {
        console.log("Fetched invoices:", data.data);
        setInvoices(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch invoices.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast({
        title: "Error",
        description: "Failed to fetch invoices. Please try again.",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const newSubTotal = calculateSubtotal(selectedServices);
    const discount = calculateDiscount(newSubTotal, paymentDetails.offer);
    const newTotal = calculateTotal(newSubTotal, paymentDetails.offer);
    const newBalance = calculateBalance(newTotal, paymentDetails.amountPaid);

    setPaymentDetails((prev) => ({
      ...prev,
      subTotal: newSubTotal,
      totalAmount: newTotal,
      balance: newBalance,
      discount: discount,
    }));
  }, [selectedServices, paymentDetails.offer, paymentDetails.amountPaid]);

  const createPrintPayload = (): InvoicePayload => ({
    type: "invoice",
    patientInfo,
    invoiceDetails,
    paymentDetails,
    selectedServices,
    createdBy: user?.email,
  });

  const handlePrintInvoice = async (payload?: InvoicePayload) => {
    const printData = payload || printPayload;

    if (!printData || !isPrintable(printData)) {
      toast({
        title: "Cannot Print",
        description: "Patient info or invoice items are missing.",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await printInvoice(printData);

      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
    } catch (error) {
      console.error("Print error:", error);
      toast({
        title: "Print Error",
        description:
          (error instanceof Error ? error.message : String(error)) ||
          "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    const payload = mapInvoiceToPayload(invoice);
    setPrintPayload(payload);
    setIsDetailsModalOpen(true);
  };

  const InvoiceDetailsModal = () => {
    if (!printPayload) return;
    const isValid = isPrintable(printPayload);
    if (!isValid) {
      toast({
        title: "Missing Data",
        description: "Some invoice data is incomplete.",
        variant: "destructive",
      });
      return;
    }
    console.log("Selected Invoice for Details:", printPayload);

    return (
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              ID- {printPayload.invoiceDetails.invoiceId}
              <div className="text-right">
                <Badge
                  className={
                    printPayload.paymentDetails.status === "PAID"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {printPayload.paymentDetails.status === "PAID" ? (
                    <CheckCircle className="h-3 w-3 mr-1" />
                  ) : (
                    <Clock className="h-3 w-3 mr-1" />
                  )}
                  {printPayload.paymentDetails.status}
                </Badge>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient and Invoice Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4 text-indigo-600" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Patient Name</p>
                    <p className="font-semibold">
                      {printPayload.patientInfo.patientName || ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Patient ID</p>
                    <p className="font-semibold">
                      {printPayload.patientInfo.id}
                    </p>
                  </div>
                  {printPayload.patientInfo.phone && (
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold">
                        {printPayload.patientInfo.phone}
                      </p>
                    </div>
                  )}
                  {printPayload.patientInfo.email && (
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">
                        {printPayload.patientInfo.email}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Invoice Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-semibold">
                      {new Date(
                        printPayload.invoiceDetails.date
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-semibold capitalize">
                      {printPayload.paymentDetails.paymentMethod ||
                        "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Created By</p>
                    <p className="font-semibold">
                      {printPayload.invoiceDetails.createdBy || "System"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Services/Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Services & Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Service/Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Rate (₹)</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {printPayload.selectedServices?.map(
                      (item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.description && (
                                <p className="text-sm text-gray-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{item.price}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹
                            {(item.price * item.quantity).toLocaleString(
                              "en-IN"
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    ) || (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-gray-500"
                        >
                          No items found for this invoice
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-indigo-600" />
                  Payment Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>
                      ₹
                      {printPayload.paymentDetails.subTotal?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>offer:</span>
                    <span>
                      {printPayload.paymentDetails.offer?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                      %
                    </span>
                  </div>
                  {printPayload.paymentDetails.subTotal > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount:</span>
                      <span>
                        -₹
                        {printPayload.paymentDetails.discount.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Amount:</span>
                    <span>
                      ₹
                      {printPayload.paymentDetails.totalAmount?.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Amount Paid:</span>
                    <span>
                      ₹
                      {printPayload.paymentDetails.amountPaid?.toLocaleString(
                        "en-IN"
                      ) || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Balance Due:</span>
                    <span>
                      ₹
                      {printPayload.paymentDetails.balance.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {printPayload.invoiceDetails.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {printPayload.invoiceDetails.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handlePrintInvoice()}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <>
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                TheraCure Billing System
              </h2>
              <p className="text-sm text-gray-600">
                Professional Healthcare Management
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-teal-600 text-teal-700 hover:bg-teal-50"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>

            {/* Invoice Creation Dialog */}
            <Dialog
              open={isInvoiceDialogOpen}
              onOpenChange={setIsInvoiceDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={openInvoiceDialog}
                >
                  <Plus className="h-4 w-4" />
                  New Invoice
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <DialogTitle className="text-2xl">
                        Create New Invoice
                      </DialogTitle>
                      <DialogDescription>
                        Create a comprehensive invoice for physiotherapy
                        services
                      </DialogDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Invoice ID</p>
                      <p className="font-bold text-indigo-600">
                        {invoiceDetails.invoiceId}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Patient and Invoice Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Patient Information - ID Only */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5 text-indigo-600" />
                          Patient Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="id">Patient ID *</Label>
                          <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              id="id"
                              value={patientInfo.id}
                              onChange={handleidChange}
                              placeholder="e.g., PT-0258"
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Patient details will be auto-fetched from database
                          </p>
                        </div>

                        {/* Mock Patient Display - Shows found/not found states */}
                        {patientInfo.id && (
                          <>
                            {/* Patient Found State */}
                            {patientFound ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="h-4 w-4 text-blue-600" />
                                  <span className="font-semibold text-blue-800">
                                    Patient Found
                                  </span>
                                </div>

                                {/* Name */}
                                <div>
                                  <Label className="text-xs">Name</Label>
                                  <div className="relative mt-0.5">
                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                      value={patientInfo.patientName}
                                      readOnly
                                      className="pl-10 bg-gray-50 h-9 text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Email */}
                                <div>
                                  <Label className="text-xs">Email</Label>
                                  <div className="relative mt-0.5">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                      value={patientInfo.email}
                                      readOnly
                                      className="pl-10 bg-gray-50 h-9 text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Phone */}
                                <div>
                                  <Label className="text-xs">Phone</Label>
                                  <div className="relative mt-0.5">
                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                      value={patientInfo.phone}
                                      readOnly
                                      className="pl-10 bg-gray-50 h-9 text-sm"
                                    />
                                  </div>
                                </div>

                                {/* Address */}
                                <div>
                                  <Label className="text-xs">Address</Label>
                                  <div className="relative mt-0.5">
                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                      value={patientInfo.address}
                                      readOnly
                                      className="pl-10 bg-gray-50 h-9 text-sm"
                                    />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Patient Not Found State */
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                  <div className="flex-1">
                                    <p className="font-semibold text-red-800">
                                      Patient Not Found
                                    </p>
                                    <p className="text-sm text-red-600 mt-1">
                                      No patient found with ID: {patientInfo.id}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-3 text-sm text-gray-600">
                                  <p>Please check the patient ID or:</p>
                                  <ul className="list-disc list-inside mt-1 space-y-1 text-gray-500">
                                    <li>
                                      Verify the ID format (e.g., PT-0258)
                                    </li>
                                    <li>Create a new patient record</li>
                                    <li>Search in archived patients</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Invoice Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-600" />
                          Invoice Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="invoiceDate">Invoice Date</Label>
                          <Input
                            id="invoiceDate"
                            type="date"
                            value={invoiceDetails.date}
                            onChange={(e) =>
                              setInvoiceDetails({
                                ...invoiceDetails,
                                date: e.target.value,
                              })
                            }
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={paymentDetails.paymentMethod}
                            onValueChange={(value) =>
                              setPaymentDetails({
                                ...paymentDetails,
                                paymentMethod: value,
                              })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">
                                Credit/Debit Card
                              </SelectItem>
                              <SelectItem value="upi">UPI</SelectItem>
                              <SelectItem value="netbanking">
                                Net Banking
                              </SelectItem>
                              <SelectItem value="cheque">Cheque</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="amountPaid">Amount Paid (₹)</Label>
                          <Input
                            id="amountPaid"
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentDetails.amountPaid || ""}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Number(e.target.value) || 0
                              );
                              setPaymentDetails({
                                ...paymentDetails,
                                amountPaid: value,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === "-" ||
                                e.key === "+" ||
                                e.key === "e" ||
                                e.key === "E"
                              ) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="0"
                            className="mt-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </div>

                        <div>
                          <Label htmlFor="offer">Offer Apply (%)</Label>
                          <Input
                            id="offer"
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={paymentDetails.offer || ""}
                            onChange={(e) => {
                              const value = Math.max(
                                0,
                                Math.min(100, Number(e.target.value) || 0)
                              );
                              setPaymentDetails({
                                ...paymentDetails,
                                offer: value,
                              });
                            }}
                            onKeyDown={(e) => {
                              if (
                                e.key === "-" ||
                                e.key === "+" ||
                                e.key === "e" ||
                                e.key === "E"
                              ) {
                                e.preventDefault();
                              }
                            }}
                            placeholder="0"
                            className="mt-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Available Services - Checkbox Style */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-indigo-600" />
                            Available Services
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            Select services to add to the invoice
                          </p>
                        </div>
                        <Badge variant="outline" className="text-indigo-600">
                          {selectedServices.length} Selected
                        </Badge>
                      </div>
                    </CardHeader>
                    {isServicesLoading ? (
                      <CardContent>
                        <div className="flex justify-center items-center h-full">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      </CardContent>
                    ) : (
                      <CardContent>
                        <div className="space-y-6">
                          {/* Manual Therapy Services */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                              <HandMetal className="h-4 w-4" />
                              <h3 className="font-semibold">Manual Therapy</h3>
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {
                                  services?.filter(
                                    (s) => s.category === "manual-therapy"
                                  ).length
                                }{" "}
                                services
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {services
                                ?.filter(
                                  (service) =>
                                    service.category === "manual-therapy"
                                )
                                .map((service) => {
                                  const isSelected = selectedServices.some(
                                    (s) => s.id === service.id
                                  );
                                  const quantity =
                                    selectedServices.find(
                                      (s) => s.id === service.id
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={service.id}
                                      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50 shadow-md"
                                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelected
                                          ? removeService(service.id)
                                          : addService(service)
                                      }
                                    >
                                      {/* Checkbox */}
                                      <div className="absolute top-2 right-2">
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-indigo-600 border-indigo-600"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-2.5 w-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Service Content */}
                                      <div className="pr-6">
                                        <h4
                                          className={`font-semibold text-sm mb-1 ${
                                            isSelected
                                              ? "text-indigo-900"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p
                                            className={`text-sm font-bold ${
                                              isSelected
                                                ? "text-indigo-600"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            ₹{service.price}
                                          </p>
                                          {isSelected && (
                                            <Badge className="bg-indigo-600 text-white text-xs py-0 px-1">
                                              Added
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Quantity Controls */}
                                      {isSelected && (
                                        <div
                                          className="mt-2 pt-2 border-t border-indigo-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-indigo-700">
                                              Qty:
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity - 1
                                                  )
                                                }
                                              >
                                                <Minus className="h-2.5 w-2.5" />
                                              </Button>
                                              <span className="w-5 text-center font-semibold text-indigo-800 text-xs">
                                                {quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-600">
                                              Total:
                                            </span>
                                            <span className="font-bold text-indigo-700">
                                              ₹{service.price * quantity}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Electrotherapy Services */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                              <Zap className="h-4 w-4" />
                              <h3 className="font-semibold">Electrotherapy</h3>
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {
                                  services?.filter(
                                    (s) => s.category === "electrotherapy"
                                  ).length
                                }{" "}
                                services
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {services
                                ?.filter(
                                  (service) =>
                                    service.category === "electrotherapy"
                                )
                                .map((service) => {
                                  const isSelected = selectedServices.some(
                                    (s) => s.id === service.id
                                  );
                                  const quantity =
                                    selectedServices.find(
                                      (s) => s.id === service.id
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={service.id}
                                      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50 shadow-md"
                                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelected
                                          ? removeService(service.id)
                                          : addService(service)
                                      }
                                    >
                                      {/* Checkbox */}
                                      <div className="absolute top-2 right-2">
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-indigo-600 border-indigo-600"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-2.5 w-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Service Content */}
                                      <div className="pr-6">
                                        <h4
                                          className={`font-semibold text-sm mb-1 ${
                                            isSelected
                                              ? "text-indigo-900"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p
                                            className={`text-sm font-bold ${
                                              isSelected
                                                ? "text-indigo-600"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            ₹{service.price}
                                          </p>
                                          {isSelected && (
                                            <Badge className="bg-indigo-600 text-white text-xs py-0 px-1">
                                              Added
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Quantity Controls */}
                                      {isSelected && (
                                        <div
                                          className="mt-2 pt-2 border-t border-indigo-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-indigo-700">
                                              Qty:
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity - 1
                                                  )
                                                }
                                              >
                                                <Minus className="h-2.5 w-2.5" />
                                              </Button>
                                              <span className="w-5 text-center font-semibold text-indigo-800 text-xs">
                                                {quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-600">
                                              Total:
                                            </span>
                                            <span className="font-bold text-indigo-700">
                                              ₹{service.price * quantity}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Exercise Therapy Services */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-700">
                              <Dumbbell className="h-4 w-4" />
                              <h3 className="font-semibold">
                                Exercise Therapy
                              </h3>
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {
                                  services?.filter(
                                    (s) => s.category === "exercise-therapy"
                                  ).length
                                }{" "}
                                services
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {services
                                ?.filter(
                                  (service) =>
                                    service.category === "exercise-therapy"
                                )
                                .map((service) => {
                                  const isSelected = selectedServices.some(
                                    (s) => s.id === service.id
                                  );
                                  const quantity =
                                    selectedServices.find(
                                      (s) => s.id === service.id
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={service.id}
                                      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? "border-indigo-500 bg-indigo-50 shadow-md"
                                          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelected
                                          ? removeService(service.id)
                                          : addService(service)
                                      }
                                    >
                                      {/* Checkbox */}
                                      <div className="absolute top-2 right-2">
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-indigo-600 border-indigo-600"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-2.5 w-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>

                                      {/* Service Content */}
                                      <div className="pr-6">
                                        <h4
                                          className={`font-semibold text-sm mb-1 ${
                                            isSelected
                                              ? "text-indigo-900"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p
                                            className={`text-sm font-bold ${
                                              isSelected
                                                ? "text-indigo-600"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            ₹{service.price}
                                          </p>
                                          {isSelected && (
                                            <Badge className="bg-indigo-600 text-white text-xs py-0 px-1">
                                              Added
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {/* Quantity Controls */}
                                      {isSelected && (
                                        <div
                                          className="mt-2 pt-2 border-t border-indigo-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-indigo-700">
                                              Qty:
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity - 1
                                                  )
                                                }
                                              >
                                                <Minus className="h-2.5 w-2.5" />
                                              </Button>
                                              <span className="w-5 text-center font-semibold text-indigo-800 text-xs">
                                                {quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-indigo-300 text-indigo-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-600">
                                              Total:
                                            </span>
                                            <span className="font-bold text-indigo-700">
                                              ₹{service.price * quantity}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Consultation Services */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border bg-green-50 border-green-200 text-green-700">
                              <Stethoscope className="h-4 w-4" />
                              <h3 className="font-semibold">Consultation</h3>
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {
                                  services?.filter(
                                    (s) => s.category === "consultation"
                                  ).length
                                }{" "}
                                services
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {services
                                ?.filter(
                                  (service) =>
                                    service.category === "consultation"
                                )
                                .map((service) => {
                                  const isSelected = selectedServices.some(
                                    (s) => s.id === service.id
                                  );
                                  const quantity =
                                    selectedServices.find(
                                      (s) => s.id === service.id
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={service.id}
                                      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? "border-green-500 bg-green-50 shadow-md"
                                          : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelected
                                          ? removeService(service.id)
                                          : addService(service)
                                      }
                                    >
                                      <div className="absolute top-2 right-2">
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-green-600 border-green-600"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-2.5 w-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>

                                      <div className="pr-6">
                                        <h4
                                          className={`font-semibold text-sm mb-1 ${
                                            isSelected
                                              ? "text-green-900"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p
                                            className={`text-sm font-bold ${
                                              isSelected
                                                ? "text-green-600"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            ₹{service.price}
                                          </p>
                                          {isSelected && (
                                            <Badge className="bg-green-600 text-white text-xs py-0 px-1">
                                              Added
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {isSelected && (
                                        <div
                                          className="mt-2 pt-2 border-t border-green-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-green-700">
                                              Qty:
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-green-300 text-green-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity - 1
                                                  )
                                                }
                                              >
                                                <Minus className="h-2.5 w-2.5" />
                                              </Button>
                                              <span className="w-5 text-center font-semibold text-green-800 text-xs">
                                                {quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-green-300 text-green-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-600">
                                              Total:
                                            </span>
                                            <span className="font-bold text-green-700">
                                              ₹{service.price * quantity}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* COMBO TREATMENT Services */}
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700">
                              <Calculator className="h-4 w-4" />
                              <h3 className="font-semibold">Combo Treatment</h3>
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {
                                  services?.filter(
                                    (s) => s.category === "combo-treatment"
                                  ).length
                                }{" "}
                                services
                              </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {services
                                ?.filter(
                                  (service) =>
                                    service.category === "combo-treatment"
                                )
                                .map((service) => {
                                  const isSelected = selectedServices.some(
                                    (s) => s.id === service.id
                                  );
                                  const quantity =
                                    selectedServices.find(
                                      (s) => s.id === service.id
                                    )?.quantity || 0;

                                  return (
                                    <div
                                      key={service.id}
                                      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
                                        isSelected
                                          ? "border-purple-500 bg-purple-50 shadow-md"
                                          : "border-gray-200 hover:border-purple-300 hover:bg-gray-50"
                                      }`}
                                      onClick={() =>
                                        isSelected
                                          ? removeService(service.id)
                                          : addService(service)
                                      }
                                    >
                                      <div className="absolute top-2 right-2">
                                        <div
                                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                            isSelected
                                              ? "bg-purple-600 border-purple-600"
                                              : "border-gray-300"
                                          }`}
                                        >
                                          {isSelected && (
                                            <Check className="h-2.5 w-2.5 text-white" />
                                          )}
                                        </div>
                                      </div>

                                      <div className="pr-6">
                                        <h4
                                          className={`font-semibold text-sm mb-1 ${
                                            isSelected
                                              ? "text-purple-900"
                                              : "text-gray-800"
                                          }`}
                                        >
                                          {service.name}
                                        </h4>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                                          {service.description}
                                        </p>
                                        <div className="flex items-center justify-between">
                                          <p
                                            className={`text-sm font-bold ${
                                              isSelected
                                                ? "text-purple-600"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            ₹{service.price}
                                          </p>
                                          {isSelected && (
                                            <Badge className="bg-purple-600 text-white text-xs py-0 px-1">
                                              Added
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      {isSelected && (
                                        <div
                                          className="mt-2 pt-2 border-t border-purple-200"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-purple-700">
                                              Qty:
                                            </span>
                                            <div className="flex items-center gap-1">
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-purple-300 text-purple-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity - 1
                                                  )
                                                }
                                              >
                                                <Minus className="h-2.5 w-2.5" />
                                              </Button>
                                              <span className="w-5 text-center font-semibold text-purple-800 text-xs">
                                                {quantity}
                                              </span>
                                              <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-5 w-5 p-0 border-purple-300 text-purple-600"
                                                onClick={() =>
                                                  updateServiceQuantity(
                                                    service.id,
                                                    quantity + 1
                                                  )
                                                }
                                              >
                                                <Plus className="h-2.5 w-2.5" />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="flex justify-between items-center mt-1 text-xs">
                                            <span className="text-gray-600">
                                              Total:
                                            </span>
                                            <span className="font-bold text-purple-700">
                                              ₹{service.price * quantity}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          </div>

                          {/* Summary Section */}
                          {selectedServices.length > 0 && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-5 w-5 text-indigo-600" />
                                  <span className="font-semibold text-indigo-800">
                                    {selectedServices.length} service
                                    {selectedServices.length !== 1
                                      ? "s"
                                      : ""}{" "}
                                    selected
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-indigo-600">
                                    Total Quantity
                                  </p>
                                  <p className="font-bold text-indigo-800">
                                    {selectedServices.reduce(
                                      (sum, s) => sum + s.quantity,
                                      0
                                    )}{" "}
                                    sessions
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Selected Services</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedServices.map((service) => (
                            <div
                              key={service.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                            >
                              <div className="flex-1">
                                <h4 className="font-semibold">
                                  {service.name}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  ₹{service.price} per session
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateServiceQuantity(
                                        service.id,
                                        service.quantity - 1
                                      )
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    -
                                  </Button>
                                  <span className="w-8 text-center font-semibold">
                                    {service.quantity}
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      updateServiceQuantity(
                                        service.id,
                                        service.quantity + 1
                                      )
                                    }
                                    className="h-8 w-8 p-0"
                                  >
                                    +
                                  </Button>
                                </div>
                                <div className="text-right min-w-[80px]">
                                  <p className="font-bold">
                                    ₹{service.price * service.quantity}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeService(service.id)}
                                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <Separator className="my-4" />

                        {/* Totals */}
                        <div className="bg-gray-100 p-4 rounded-lg">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>₹{paymentDetails.subTotal}</span>
                            </div>
                            {paymentDetails.offer > 0 && (
                              <div className="flex justify-between">
                                <span>
                                  Offer applied ({paymentDetails.offer} %):
                                </span>
                                <span>₹{paymentDetails.discount}</span>
                              </div>
                            )}

                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                              <span>Total:</span>
                              <span>₹{paymentDetails.totalAmount}</span>
                            </div>
                            <div className="flex justify-between text-green-600">
                              <span>Amount Paid:</span>
                              <span>₹{paymentDetails.amountPaid}</span>
                            </div>
                            <div className="flex justify-between text-red-600 font-semibold">
                              <span>Balance Due:</span>
                              <span>₹{paymentDetails.balance}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <DialogFooter className="flex justify-end gap-2">
                  <Button variant="outline" onClick={closeInvoiceDialog}>
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePrintInvoice(createPrintPayload())}
                    className="flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    onClick={handleSaveInvoice}
                    className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Invoice
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {user?.role == "admin" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 flex items-center">
                <div className="bg-teal-50 p-3 rounded-full mr-4">
                  <CreditCard className="h-6 w-6 text-teal-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <h3 className="text-2xl font-bold">₹2,85,000</h3>
                  <p className="text-xs text-green-600">+12% from last month</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center">
                <div className="bg-green-50 p-3 rounded-full mr-4">
                  <IndianRupee className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Paid Invoices</p>
                  <h3 className="text-2xl font-bold">₹2,28,000</h3>
                  <p className="text-xs text-green-600">80% of total</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center">
                <div className="bg-amber-50 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Payments</p>
                  <h3 className="text-2xl font-bold">₹57,000</h3>
                  <p className="text-xs text-amber-600">20% of total</p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          ""
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-indigo-700">
                <TableHead className="font-semibold text-white">
                  Invoice ID
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Patient
                </TableHead>
                <TableHead className="font-semibold text-white">Date</TableHead>
                <TableHead className="font-semibold text-white">
                  Amount
                </TableHead>
                <TableHead className="font-semibold text-white">
                  Status
                </TableHead>
                <TableHead className="font-semibold text-white text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{invoice.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {invoice.patient.patientName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invoice.date).toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {invoice.totalAmount}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          invoice.status === "PAID"
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-red-100 text-red-700 hover:bg-red-100"
                        }
                      >
                        {invoice.status === "PAID" ? (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        ) : (
                          <Clock className="h-3 w-3 mr-1" />
                        )}
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
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
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(invoice)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              toast({
                                title: "Payment reminder sent",
                                description: `Reminder sent to ${invoice.patient.patientName} for payment`,
                              });
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Send Reminder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-gray-500"
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <FileText className="h-12 w-12 text-gray-300" />
                      <p className="text-lg font-medium">No invoices found</p>
                      <p className="text-sm">
                        Create your first invoice to get started
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 bg-white border-t">
            <span className="text-sm text-gray-700">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2 items-center">
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <Button
                  key={pg}
                  size="sm"
                  variant={pg === page ? "default" : "outline"}
                  className={
                    pg === page
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                      : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  }
                  onClick={() => setPage(pg)}
                >
                  {pg}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                className="border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InvoiceDetailsModal />
    </>
  );
}

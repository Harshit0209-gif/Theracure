import { useMemo, useState } from "react";
import { Plus, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
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
  mapInvoiceToPrintPayload,
} from "@/lib/utils/invoiceUtils";

import { validateInvoice } from "@/lib/validations/invoiceValidator";
import { saveInvoice, printInvoice } from "@/lib/api/invoice";

import {
  Invoice,
  PaymentDetails,
  InvoicePayload,
  defaultPaymentDetails,
  PaymentStatus,
  defaultInvoice,
  TransactionStatus,
} from "@/types/invoice";
import { useAdminDashboardData } from "@/hooks/use-admin-dashboard-data";
import { InvoiceDetailsModal } from "./InvoiceModel";
import { UserRole } from "@/lib/generated/userRoles";
import { PurchasedService, SelectedService } from "@/types/service";
import { defaultPatient, Patient } from "@/types/patient";
import { InvoiceStatsCards } from "./InvoiceStatsCard";
import { PatientInfoSection } from "./PatientInfoSection";
import { ServiceSelection } from "./ServiceSelection";
import { SelectedServicesSection } from "./SelectedServiceSection";
import { InvoiceTable } from "./InvoiceTable";
import { InvoiceDetailsSection } from "./InvoiceDetailsSection";

export function InvoicesSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [patientFound, setPatientFound] = useState(false);
  const [services, setServices] = useState<PurchasedService[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const totalPages = Math.ceil(invoices.length / pageSize);
  const [selectedInvoiceForDetails, setSelectedInvoiceForDetails] =
    useState<Invoice>();
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const paginatedInvoices = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return invoices.slice(startIndex, startIndex + pageSize);
  }, [invoices, page, pageSize]);

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PurchasedService[]>(
    [],
  );
  const [printPayload, setPrintPayload] = useState<InvoicePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [patientInfo, setPatientInfo] = useState<Patient>(defaultPatient);

  const [invoiceDetails, setInvoiceDetails] = useState<Invoice>(defaultInvoice);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(
    defaultPaymentDetails,
  );

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
    [toast],
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
    [fetchPatientDetails],
  );

  const handleidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPatientInfo((prev) => ({ ...prev, id: value }));
    debouncedSearch(value);
  };

  const addService = (service: SelectedService) => {
    const existingService = selectedServices.find((s) => s.id === service.id);
    if (existingService) {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === service.id ? { ...s, quantity: s.quantity + 1 } : s,
        ),
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
          s.id === serviceId ? { ...s, quantity } : s,
        ),
      );
    }
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(selectedServices?.filter((s) => s.id !== serviceId));
  };

  const openInvoiceDialog = () => {
    setInvoiceDetails({
      ...invoiceDetails,
      id: generateInvoiceId(),
    });
    setIsInvoiceDialogOpen(true);
  };

  const closeInvoiceDialog = () => {
    setIsInvoiceDialogOpen(false);
    setSelectedServices([]);
    setPatientInfo(defaultPatient);
    setInvoiceDetails(defaultInvoice);
    setPaymentDetails(defaultPaymentDetails);
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

    const result = await saveInvoice(invoicePayload);
    if (result.success) {
      const { invoice, selectedServices } = result.data;
      setInvoices((prev) => [
        {
          ...invoice,
          invoiceItems: selectedServices.map((i: PurchasedService) => ({
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
    const newTotal = calculateTotal(newSubTotal, discount);
    const newBalance = calculateBalance(newTotal, paymentDetails.amountPaid);

    setPaymentDetails((prev) => ({
      ...prev,
      subTotal: newSubTotal,
      totalAmount: newTotal,
      balance: newBalance,
      discount: discount,
      status: newBalance <= 0 ? PaymentStatus.PAID : PaymentStatus.PENDING,
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
    const amountPaidFromTransactions = invoice.transactions
      ? parseFloat(
          invoice.transactions
            .filter((t) => t.status === TransactionStatus.SUCCESS)
            .reduce((sum, t) => {
              const transactionAmount = parseFloat(t.amount.toFixed(2));
              return sum + transactionAmount;
            }, 0)
            .toFixed(2),
        )
      : parseFloat(invoice.amountPaid.toFixed(2));

    const subTotal = parseFloat(invoice.subTotal.toFixed(2));
    const totalAmount = parseFloat(invoice.totalAmount.toFixed(2));
    const discount = calculateDiscount(subTotal, invoice.offer || 0);
    const balance = calculateBalance(totalAmount, amountPaidFromTransactions);

    const invoicePaymentDetails: PaymentDetails = {
      totalAmount: totalAmount,
      amountPaid: amountPaidFromTransactions,
      subTotal: subTotal,
      offer: invoice.offer || 0,
      discount: discount,
      balance: balance,
      status:
        invoice.status === "PAID"
          ? PaymentStatus.PAID
          : invoice.status === "DUE"
            ? PaymentStatus.PENDING
            : PaymentStatus.PENDING,
    };

    const payload = mapInvoiceToPrintPayload(invoice, invoicePaymentDetails);
    setPrintPayload(payload);
    setIsDetailsModalOpen(true);
  };

  const handleDirectPrint = (invoice: Invoice) => {
    const amountPaidFromTransactions = invoice.transactions
      ? parseFloat(
          invoice.transactions
            .filter((t) => t.status === TransactionStatus.SUCCESS)
            .reduce((sum, t) => {
              const transactionAmount = parseFloat(t.amount.toFixed(2));
              return sum + transactionAmount;
            }, 0)
            .toFixed(2),
        )
      : parseFloat(invoice.amountPaid.toFixed(2));

    const subTotal = parseFloat(invoice.subTotal.toFixed(2));
    const totalAmount = parseFloat(invoice.totalAmount.toFixed(2));
    const discount = calculateDiscount(subTotal, invoice.offer || 0);
    const balance = calculateBalance(totalAmount, amountPaidFromTransactions);

    const invoicePaymentDetails: PaymentDetails = {
      totalAmount: totalAmount,
      amountPaid: amountPaidFromTransactions,
      subTotal: subTotal,
      offer: invoice.offer || 0,
      discount: discount,
      balance: balance,
      status:
        invoice.status === "PAID"
          ? PaymentStatus.PAID
          : invoice.status === "DUE"
            ? PaymentStatus.PENDING
            : PaymentStatus.PENDING,
    };

    const payload = mapInvoiceToPrintPayload(invoice, invoicePaymentDetails);
    handlePrintInvoice(payload);
  };

  function InvoiceCardViewer() {
    const { revenueStatus, isLoading, error } = useAdminDashboardData();

    return (
      <InvoiceStatsCards
        revenueStatus={revenueStatus}
        isLoading={isLoading}
        error={error}
      />
    );
  }
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
                        {invoiceDetails.id}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Patient and Invoice Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PatientInfoSection
                      patientInfo={patientInfo}
                      patientFound={patientFound}
                      onIdChange={handleidChange}
                    />

                    {/* Invoice Details */}
                    <InvoiceDetailsSection
                      invoiceDetails={invoiceDetails}
                      paymentDetails={paymentDetails}
                      onInvoiceDetailsChange={setInvoiceDetails}
                      onPaymentDetailsChange={setPaymentDetails}
                    />
                  </div>

                  {/* Available Services - Checkbox Style */}
                  <ServiceSelection
                    services={services}
                    selectedServices={selectedServices}
                    isServicesLoading={isServicesLoading}
                    addService={addService}
                    removeService={removeService}
                    updateServiceQuantity={updateServiceQuantity}
                  />

                  {/* Selected Services */}
                  {selectedServices.length > 0 && (
                    <SelectedServicesSection
                      selectedServices={selectedServices}
                      paymentDetails={paymentDetails}
                      onQuantityChange={updateServiceQuantity}
                      onRemoveService={removeService}
                    />
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
        {user?.role == UserRole.ADMIN ? InvoiceCardViewer() : null}

        {/* Invoices Table */}
        <InvoiceTable
          invoices={paginatedInvoices}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          handleViewDetails={handleViewDetails}
          handleDirectPrint={handleDirectPrint}
        />
      </div>
      <InvoiceDetailsModal
        printPayload={printPayload}
        isDetailsModalOpen={isDetailsModalOpen}
        setIsDetailsModalOpen={setIsDetailsModalOpen}
        handlePrintInvoice={handlePrintInvoice}
      />
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Minus,
  Printer,
  Save,
  Loader2,
  CalendarDays,
  Zap,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
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
import { InvoiceList } from "./InvoiceList";
import { DatePickerDialog } from "@/components/ui/date-picker-dialog";

export function InvoicesSection() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [patientFound, setPatientFound] = useState(false);
  const [services, setServices] = useState<PurchasedService[]>([]);
  const CACHE_LIMIT = 100; // max records fetched in one server request

  const [cachedInvoices, setCachedInvoices] = useState<Invoice[]>([]);
  const [totalServerCount, setTotalServerCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset to page 1 on search or page size change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, pageSize]);

  // Slice from cache for the current page — no API call needed
  const invoices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return cachedInvoices.slice(start, start + pageSize);
  }, [cachedInvoices, page, pageSize]);

  // Total pages always based on full server count
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalServerCount / pageSize)),
    [totalServerCount, pageSize],
  );

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<PurchasedService[]>(
    [],
  );
  const [printPayload, setPrintPayload] = useState<InvoicePayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const [patientInfo, setPatientInfo] = useState<Patient>(defaultPatient);

  const [invoiceDetails, setInvoiceDetails] = useState<Invoice>(defaultInvoice);

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>(
    defaultPaymentDetails,
  );
  const [discountPctInput, setDiscountPctInput] = useState("");
  const [discountAmtInput, setDiscountAmtInput] = useState("");

  const [isDateCalendarOpen, setIsDateCalendarOpen] = useState(false);

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
    fetchServices();
  }, [fetchServices]);

  const handlePatientSelect = useCallback((patient: Patient) => {
    if (!patient.id) {
      setPatientFound(false);
      setPatientInfo(defaultPatient);
    } else {
      setPatientFound(true);
      setPatientInfo(patient);
    }
  }, []);

  const handlePatientFieldChange = useCallback(
    (field: keyof Patient, value: string) => {
      setPatientInfo((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

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
    setPatientInfo(defaultPatient);
    setPatientFound(false);
    setSelectedServices([]);
    setPaymentDetails(defaultPaymentDetails);
    setInvoiceDetails({ ...defaultInvoice, id: "" });
    setDiscountPctInput("");
    setDiscountAmtInput("");
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
    if (isSavingRef.current) return;
    const isValid = validateInvoice({
      patientInfo,
      selectedServices,
      paymentDetails,
      invoiceDetails,
      user,
      toast,
    });
    if (!isValid) return;

    isSavingRef.current = true;
    setIsSaving(true);
    try {
      const result = await saveInvoice(invoicePayload);
      if (result.success) {
        const { invoice, pdfPath } = result.data;
        setPage(1);
        fetchInvoices(1, debouncedSearch, false);
        toast({
          title: "Invoice Created",
          description: "Invoice created successfully.",
        });
        if (pdfPath && invoice?.patient?.phone) {
          toast({
            title: "SMS Sent",
            description: `Invoice link sent to ${invoice.patient.phone}.`,
          });
        }
        closeInvoiceDialog();
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  const fetchInvoices = useCallback(
    async (serverPage = 1, search = debouncedSearch, append = false) => {
      setIsInvoicesLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(serverPage),
          limit: String(CACHE_LIMIT),
          ...(search ? { search } : {}),
        });
        const response = await fetch(`/api/invoices?${params}`);
        const data = await response.json();
        if (response.ok && data.success) {
          // append = true when loading next batch beyond current cache
          setCachedInvoices((prev) =>
            append ? [...prev, ...data.data] : data.data,
          );
          setTotalServerCount(data.pagination?.totalCount ?? data.data.length);
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
      } finally {
        setIsInvoicesLoading(false);
      }
    },
    [debouncedSearch, CACHE_LIMIT],
  );

  // Re-fetch (replace cache) when search changes
  useEffect(() => {
    fetchInvoices(1, debouncedSearch, false);
  }, [debouncedSearch]);

  // Append next batch when user pages beyond what's cached
  useEffect(() => {
    const cachedEnd = cachedInvoices.length;
    const neededEnd = page * pageSize;
    if (neededEnd > cachedEnd && cachedEnd < totalServerCount) {
      const serverPage = Math.floor(cachedEnd / CACHE_LIMIT) + 1;
      fetchInvoices(serverPage, debouncedSearch, true);
    }
  }, [page, pageSize]);

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
    if (printData.invoiceDetails?.id) {
      window.open(`/api/invoices/${printData.invoiceDetails.id}/pdf`, "_blank");
      return;
    }

    try {
      const blob = await printInvoice(printData);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoice-${printData.patientInfo?.patientName || "patient"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
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
      <div className="bg-indigo-50/30 rounded-xl p-6 mb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
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

              <DialogContent className="max-w-6xl w-full max-h-[92vh] flex flex-col p-0 gap-0">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
                  <div>
                    <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-indigo-500" />
                      New Invoice
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-400 mt-0.5">
                      Fill in the details below to create a new invoice.
                    </DialogDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDateCalendarOpen(true)}
                    className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left"
                  >
                    <CalendarDays className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                        Invoice Date
                      </p>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {new Date(invoiceDetails.date).toLocaleDateString(
                          "en-IN",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Body — two columns */}
                <div className="flex flex-1 overflow-hidden">
                  {/* Left — Patient + Services */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 border-r border-gray-100">
                    <PatientInfoSection
                      patientInfo={patientInfo}
                      patientFound={patientFound}
                      onPatientSelect={handlePatientSelect}
                      onPatientChange={handlePatientFieldChange}
                    />
                    <ServiceSelection
                      services={services}
                      selectedServices={selectedServices}
                      isServicesLoading={isServicesLoading}
                      addService={addService}
                      removeService={removeService}
                      updateServiceQuantity={updateServiceQuantity}
                    />
                  </div>

                  {/* Right — Payment panel */}
                  <div className="w-72 flex-shrink-0 flex flex-col overflow-hidden border-l border-gray-100">
                    {selectedServices.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                        <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center mb-3">
                          <Plus className="h-4 w-4 text-gray-300" />
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          No services selected
                        </p>
                        <p className="text-xs text-gray-300 mt-1">
                          Pick services from the left
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col h-full overflow-y-auto divide-y divide-gray-100">
                        {/* — Services list — */}
                        <div className="px-5 pt-5 pb-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                              Services
                            </p>
                            <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full">
                              {selectedServices.length}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {selectedServices.map((s) => (
                              <div
                                key={s.id}
                                className="flex items-center gap-2 rounded-lg border border-gray-100 px-2.5 py-2 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors group"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
                                    {s.name}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    ₹{s.price.toFixed(2)} / unit
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateServiceQuantity(
                                        s.id,
                                        s.quantity - 1,
                                      )
                                    }
                                    className="w-5 h-5 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                  >
                                    <Minus className="h-2.5 w-2.5" />
                                  </button>
                                  <span className="text-sm font-bold text-gray-800 w-4 text-center tabular-nums">
                                    {s.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateServiceQuantity(
                                        s.id,
                                        s.quantity + 1,
                                      )
                                    }
                                    className="w-5 h-5 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                                  >
                                    <Plus className="h-2.5 w-2.5" />
                                  </button>
                                  <span className="text-sm font-bold text-gray-900 w-12 text-right tabular-nums">
                                    ₹{(s.price * s.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* — Discount — */}
                        <div className="px-5 py-4 space-y-2.5">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                            Discount
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[0, 5, 10, 15, 20, 25, 50, 100].map((pct) => (
                              <button
                                key={pct}
                                type="button"
                                onClick={() => {
                                  setPaymentDetails((prev) => ({
                                    ...prev,
                                    offer: pct,
                                  }));
                                  setDiscountPctInput(
                                    pct === 0 ? "" : String(pct),
                                  );
                                  const amt =
                                    pct === 0
                                      ? 0
                                      : parseFloat(
                                          (
                                            (paymentDetails.subTotal * pct) /
                                            100
                                          ).toFixed(2),
                                        );
                                  setDiscountAmtInput(
                                    amt > 0 ? String(amt) : "",
                                  );
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                  paymentDetails.offer === pct
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                    : "border-gray-200 text-gray-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                              >
                                {pct === 0 ? "None" : `${pct}%`}
                              </button>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <div className="relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={discountPctInput}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  setDiscountPctInput(raw);
                                  const pct = Math.min(
                                    Math.max(0, Number(raw) || 0),
                                    100,
                                  );
                                  const amt = parseFloat(
                                    (
                                      (paymentDetails.subTotal * pct) /
                                      100
                                    ).toFixed(2),
                                  );
                                  setDiscountAmtInput(
                                    amt > 0 ? String(amt) : "",
                                  );
                                  setPaymentDetails((prev) => ({
                                    ...prev,
                                    offer: pct,
                                  }));
                                }}
                                className="w-full h-8 rounded-md border border-gray-200 bg-white px-2.5 pr-6 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                              />
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                %
                              </span>
                            </div>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                                ₹
                              </span>
                              <input
                                type="text"
                                inputMode="decimal"
                                placeholder="0.00"
                                value={discountAmtInput}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(
                                    /[^0-9.]/g,
                                    "",
                                  );
                                  setDiscountAmtInput(raw);
                                  const amt = Math.min(
                                    Math.max(0, Number(raw) || 0),
                                    paymentDetails.subTotal,
                                  );
                                  const pct =
                                    paymentDetails.subTotal > 0
                                      ? parseFloat(
                                          (
                                            (amt / paymentDetails.subTotal) *
                                            100
                                          ).toFixed(2),
                                        )
                                      : 0;
                                  setDiscountPctInput(
                                    pct > 0 ? String(pct) : "",
                                  );
                                  setPaymentDetails((prev) => ({
                                    ...prev,
                                    offer: pct,
                                  }));
                                }}
                                className="w-full h-8 rounded-md border border-gray-200 bg-white pl-6 pr-2.5 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* — Totals — */}
                        <div className="px-5 py-4 space-y-2 text-sm">
                          <div className="flex justify-between items-center text-gray-500">
                            <span>Subtotal</span>
                            <span className="tabular-nums">
                              ₹{paymentDetails.subTotal.toFixed(2)}
                            </span>
                          </div>
                          {paymentDetails.offer > 0 && (
                            <div className="flex justify-between items-center text-emerald-600">
                              <span>
                                Discount (
                                {paymentDetails.offer % 1 === 0
                                  ? paymentDetails.offer
                                  : paymentDetails.offer.toFixed(1)}
                                %)
                              </span>
                              <span className="tabular-nums font-medium">
                                −₹{paymentDetails.discount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center font-semibold text-gray-900 pt-2 border-t border-gray-100">
                            <span>Total</span>
                            <span className="text-base tabular-nums">
                              ₹{paymentDetails.totalAmount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* — Payment Method — */}
                        <div className="px-5 py-4 space-y-2.5">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                            Payment Method
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { value: "cash", label: "Cash" },
                              { value: "upi", label: "UPI" },
                              { value: "card", label: "Card" },
                              { value: "netbanking", label: "Net Banking" },
                              { value: "cheque", label: "Cheque" },
                            ].map(({ value, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() =>
                                  setInvoiceDetails((prev) => ({
                                    ...prev,
                                    paymentMethod: value as any,
                                  }))
                                }
                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                  invoiceDetails.paymentMethod === value
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                    : "border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* — Amount Paid — */}
                        <div className="px-5 py-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                              Amount Paid
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentDetails((prev) => ({
                                  ...prev,
                                  amountPaid: prev.totalAmount,
                                }))
                              }
                              className="text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-0.5 rounded-full transition-colors"
                            >
                              Pay full
                            </button>
                          </div>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="0.00"
                              value={paymentDetails.amountPaid || ""}
                              onChange={(e) => {
                                const raw = e.target.value.replace(
                                  /[^0-9.]/g,
                                  "",
                                );
                                const val = Math.min(
                                  Math.max(0, Number(raw) || 0),
                                  paymentDetails.totalAmount,
                                );
                                setPaymentDetails((prev) => ({
                                  ...prev,
                                  amountPaid: val,
                                }));
                              }}
                              className="w-full h-8 rounded-md border border-gray-200 bg-white pl-6 pr-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400"
                            />
                          </div>
                          {/* Balance / Paid status */}
                          {paymentDetails.balance > 0 ? (
                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="text-gray-400">Balance due</span>
                              <span className="font-semibold text-amber-600 tabular-nums">
                                ₹{paymentDetails.balance.toFixed(2)}
                              </span>
                            </div>
                          ) : paymentDetails.amountPaid > 0 ? (
                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="text-gray-400">Status</span>
                              <span className="font-semibold text-emerald-600">
                                Paid ✓
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
                  <Button variant="outline" onClick={closeInvoiceDialog}>
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePrintInvoice(createPrintPayload())}
                      disabled={!patientFound || selectedServices.length === 0}
                      className="flex items-center gap-1.5"
                    >
                      <Printer className="h-4 w-4" />
                      Print
                    </Button>
                    <Button
                      onClick={handleSaveInvoice}
                      disabled={
                        isSaving ||
                        !patientFound ||
                        selectedServices.length === 0
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isSaving ? "Creating..." : "Create Invoice"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        {user?.role == UserRole.ADMIN ? <InvoiceCardViewer /> : null}

        {/* Recent Invoices Section */}
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Invoices</h3>

          {/* Toolbar */}
          <div className="flex items-center justify-center bg-white border border-b-0 border-gray-200 rounded-t-xl px-4 py-1.5 shadow-sm">
            <div className="relative group w-80 focus-within:w-[480px] transition-all duration-300">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
              <Input
                placeholder="Search invoice ID, patient name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-[36px] bg-white pl-9 pr-8 w-full border-gray-300 focus:border-indigo-400 rounded-md shadow-sm text-sm"
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

          <InvoiceList
            invoices={invoices}
            isLoading={isInvoicesLoading}
            page={page}
            totalPages={totalPages}
            totalCount={totalServerCount}
            pageSize={pageSize}
            setPage={setPage}
            setPageSize={setPageSize}
            handleViewDetails={handleViewDetails}
            handleDirectPrint={handleDirectPrint}
            onPaymentSuccess={() => fetchInvoices(1, debouncedSearch, false)}
            className="rounded-t-none border-t-0"
          />
        </div>
      </div>
      {/* Invoice Date Calendar Dialog */}
      <DatePickerDialog
        open={isDateCalendarOpen}
        onOpenChange={setIsDateCalendarOpen}
        value={invoiceDetails.date}
        onChange={(date) => setInvoiceDetails((prev) => ({ ...prev, date }))}
        title="Select Invoice Date"
        disablePast={false}
        contentClassName="fixed top-16 right-6 translate-x-0 translate-y-0 data-[state=open]:slide-in-from-top-2 max-w-sm"
      />

      <InvoiceDetailsModal
        printPayload={printPayload}
        isDetailsModalOpen={isDetailsModalOpen}
        setIsDetailsModalOpen={setIsDetailsModalOpen}
        handlePrintInvoice={() =>
          printPayload && handlePrintInvoice(printPayload)
        }
        onPaymentSuccess={() => fetchInvoices(1, debouncedSearch, false)}
      />
    </>
  );
}

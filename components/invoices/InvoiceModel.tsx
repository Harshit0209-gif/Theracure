import {
  Printer,
  User,
  FileText,
  Activity,
  IndianRupee,
  CreditCard,
  Phone,
  Mail,
  CalendarDays,
  Wallet,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { isPrintable } from "@/lib/utils/invoiceUtils";
import { toast } from "@/components/ui/use-toast";
import {
  InvoicePayload,
  InvoiceStatus,
  invoiceStatusLabelMap,
  invoiceStatusStyles,
  PaymentStatus,
} from "@/types/invoice";
import React, { useState } from "react";
import { PaymentDialog } from "./PaymentDialog";

interface InvoiceDetailsModalProps {
  printPayload: InvoicePayload | null;
  isDetailsModalOpen: boolean;
  setIsDetailsModalOpen: (open: boolean) => void;
  handlePrintInvoice: () => void;
  onPaymentSuccess?: () => void;
}

// ── Small helpers ────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide whitespace-nowrap">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 text-right">
        {value}
      </span>
    </div>
  );
}

function SectionHeading({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-indigo-500">{icon}</span>
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export const InvoiceDetailsModal = ({
  printPayload,
  isDetailsModalOpen,
  setIsDetailsModalOpen,
  handlePrintInvoice,
  onPaymentSuccess,
}: InvoiceDetailsModalProps) => {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  if (!printPayload) return null;
  const isValid = isPrintable(printPayload);
  if (!isValid) {
    toast({
      title: "Missing Data",
      description: "Some invoice data is incomplete.",
      variant: "destructive",
    });
    return null;
  }

  const { invoiceDetails, patientInfo, paymentDetails } = printPayload;
  const status = invoiceDetails.status;
  const balance = paymentDetails.balance ?? 0;

  return (
    <>
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
          {/* ── Header bar ── */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <FileText className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-gray-800 leading-tight">
                    Invoice
                  </DialogTitle>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">
                    {invoiceDetails.id || "Auto-assigned on save"}
                  </p>
                </div>
              </div>
              <Badge
                className={`${invoiceStatusStyles[status]?.color} border-0 px-3 py-1 text-xs font-semibold flex items-center gap-1.5`}
              >
                {React.createElement(invoiceStatusStyles[status]?.icon, {
                  className: invoiceStatusStyles[status]?.className,
                })}
                {invoiceStatusLabelMap[status]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="px-6 py-5 space-y-6">
            {/* ── Patient + Invoice info ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Patient */}
              <div className="bg-gray-50 rounded-xl p-4">
                <SectionHeading
                  icon={<User className="h-4 w-4" />}
                  title="Patient"
                />
                <div className="divide-y divide-gray-100">
                  <InfoRow
                    label="Name"
                    value={patientInfo.patientName || "—"}
                  />
                  <InfoRow
                    label="Patient ID"
                    value={
                      <span className="font-mono text-indigo-600 text-xs bg-indigo-50 px-2 py-0.5 rounded">
                        {patientInfo.id}
                      </span>
                    }
                  />
                  {patientInfo.phone && (
                    <InfoRow
                      label="Phone"
                      value={
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          {patientInfo.phone}
                        </span>
                      }
                    />
                  )}
                  {patientInfo.email && (
                    <InfoRow
                      label="Email"
                      value={
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          {patientInfo.email}
                        </span>
                      }
                    />
                  )}
                </div>
              </div>

              {/* Invoice meta */}
              <div className="bg-gray-50 rounded-xl p-4">
                <SectionHeading
                  icon={<FileText className="h-4 w-4" />}
                  title="Invoice Info"
                />
                <div className="divide-y divide-gray-100">
                  <InfoRow
                    label="Date"
                    value={
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-gray-400" />
                        {new Date(invoiceDetails.date).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Payment Method"
                    value={
                      <span className="flex items-center gap-1 capitalize">
                        <Wallet className="h-3 w-3 text-gray-400" />
                        {invoiceDetails.paymentMethod || "Not specified"}
                      </span>
                    }
                  />
                  <InfoRow
                    label="Created By"
                    value={
                      <span className="flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-gray-400" />
                        {invoiceDetails.createdBy || "System"}
                      </span>
                    }
                  />
                </div>
              </div>
            </div>

            {/* ── Services table ── */}
            <div>
              <SectionHeading
                icon={<Activity className="h-4 w-4" />}
                title="Services & Items"
              />
              <div className="rounded-xl overflow-hidden overflow-x-auto border border-gray-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-indigo-700 text-white">
                      <th className="text-left px-4 py-2.5 font-semibold text-xs">
                        Service / Item
                      </th>
                      <th className="text-center px-4 py-2.5 font-semibold text-xs">
                        Sessions
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs">
                        Rate
                      </th>
                      <th className="text-right px-4 py-2.5 font-semibold text-xs">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {invoiceDetails.invoiceItems?.length ? (
                      invoiceDetails.invoiceItems.map(
                        (item: any, index: number) => (
                          <tr
                            key={index}
                            className="hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-800">
                                {item.serviceName}
                              </p>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right text-gray-600">
                              ₹{item.priceAtPurchase.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              ₹
                              {(item.priceAtPurchase * item.quantity).toFixed(
                                2,
                              )}
                            </td>
                          </tr>
                        ),
                      )
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-8 text-gray-400 text-sm"
                        >
                          No items found for this invoice
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Transactions ── */}
            {invoiceDetails.transactions &&
              invoiceDetails.transactions.length > 0 && (
                <div>
                  <SectionHeading
                    icon={<CreditCard className="h-4 w-4" />}
                    title="Transaction History"
                  />
                  <div className="rounded-xl overflow-hidden overflow-x-auto border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-indigo-700 text-white">
                          <th className="text-left px-4 py-2.5 font-semibold text-xs">
                            Transaction ID
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs">
                            Date & Time
                          </th>
                          <th className="text-right px-4 py-2.5 font-semibold text-xs">
                            Amount
                          </th>
                          <th className="text-left px-4 py-2.5 font-semibold text-xs">
                            Mode
                          </th>
                          <th className="text-center px-4 py-2.5 font-semibold text-xs">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 bg-white">
                        {invoiceDetails.transactions.map((txn: any) => (
                          <tr
                            key={txn.id}
                            className="hover:bg-indigo-50/30 transition-colors"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-indigo-600 bg-indigo-50/40">
                              {txn.id}
                            </td>
                            <td className="px-4 py-3 text-gray-600 text-xs">
                              {new Date(txn.transactionDate).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                              <span className="text-gray-400 ml-1">
                                {new Date(
                                  txn.transactionDate,
                                ).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-gray-800">
                              ₹{txn.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 capitalize text-xs">
                              {txn.paymentMethod || "N/A"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Badge
                                className={
                                  txn.status === "SUCCESS"
                                    ? "bg-emerald-50 text-emerald-700 border-0"
                                    : txn.status === "PENDING"
                                      ? "bg-amber-50 text-amber-700 border-0"
                                      : txn.status === "REFUNDED"
                                        ? "bg-blue-50 text-blue-700 border-0"
                                        : "bg-red-50 text-red-600 border-0"
                                }
                              >
                                {txn.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            {/* ── Payment summary ── */}
            <div className="bg-gray-50 rounded-xl p-4">
              <SectionHeading
                icon={<IndianRupee className="h-4 w-4" />}
                title="Payment Summary"
              />
              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{(paymentDetails.subTotal || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Offer</span>
                  <span>{paymentDetails.offer || 0}%</span>
                </div>
                {paymentDetails.discount > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600">
                    <span>Discount</span>
                    <span>−₹{paymentDetails.discount.toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold text-gray-800">
                  <span>Total Amount</span>
                  <span>₹{(paymentDetails.totalAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-emerald-600">
                  <span>Amount Paid</span>
                  <span>₹{(paymentDetails.amountPaid || 0).toFixed(2)}</span>
                </div>
                {balance > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-red-500 mt-1 pt-1 border-t border-red-100">
                    <span>Balance Due</span>
                    <span>₹{balance.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Notes ── */}
            {invoiceDetails.notes && (
              <div className="bg-amber-50/50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700">{invoiceDetails.notes}</p>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <DialogFooter className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailsModalOpen(false)}
            >
              Close
            </Button>
            {status === InvoiceStatus.DUE && (
              <Button
                onClick={() => setIsPaymentDialogOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <IndianRupee className="h-4 w-4 mr-1.5" />
                Process Payment
              </Button>
            )}
            <Button
              onClick={handlePrintInvoice}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4 mr-1.5" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => setIsPaymentDialogOpen(false)}
        invoice={{
          id: invoiceDetails.id,
          totalAmount: paymentDetails.totalAmount,
          amountPaid: paymentDetails.amountPaid,
          patient: { patientName: patientInfo.patientName },
        }}
        onPaymentSuccess={() => {
          setIsPaymentDialogOpen(false);
          setIsDetailsModalOpen(false);
          onPaymentSuccess?.();
        }}
      />
    </>
  );
};

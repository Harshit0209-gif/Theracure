"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PaymentMethod } from "@/types/invoice";
import { toast } from "@/components/ui/use-toast";
import {
  Loader2,
  IndianRupee,
  CalendarDays,
  CreditCard,
  User,
  Save,
} from "lucide-react";
import {
  DatePickerDialog,
  formatDateToString,
} from "@/components/ui/date-picker-dialog";

interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    totalAmount: number;
    amountPaid: number;
    patient: {
      patientName: string;
    };
  };
  onPaymentSuccess: () => void;
}

export const PaymentDialog: React.FC<PaymentDialogProps> = ({
  isOpen,
  onClose,
  invoice,
  onPaymentSuccess,
}) => {
  const remainingAmount = invoice.totalAmount - invoice.amountPaid;

  const [paymentAmountInput, setPaymentAmountInput] = useState(
    remainingAmount.toString(),
  );
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [paymentDate, setPaymentDate] = useState(
    formatDateToString(new Date()),
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPaymentAmountInput(remainingAmount.toString());
      setPaymentMethod("cash");
      setPaymentDate(formatDateToString(new Date()));
    }
  }, [isOpen, remainingAmount]);

  const handleSubmit = async () => {
    const amount = parseFloat(paymentAmountInput);

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      });
      return;
    }

    if (amount > remainingAmount) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Payment cannot exceed remaining balance of ₹${remainingAmount.toFixed(2)}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalAmount: invoice.totalAmount,
          alreadyPaid: invoice.amountPaid,
          due: remainingAmount,
          paymentAmount: amount,
          paymentMethod,
          date: new Date(paymentDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Payment Processed",
          description: `Successfully processed ₹${amount.toFixed(2)} for ${invoice.patient?.patientName || "patient"}`,
        });
        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description:
          error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "upi", label: "UPI" },
    { value: "card", label: "Card" },
    { value: "netbanking", label: "Net Banking" },
    { value: "cheque", label: "Cheque" },
  ];

  const balance = remainingAmount - (parseFloat(paymentAmountInput) || 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="p-0 gap-0 max-w-md overflow-hidden rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-100">
            <div>
              <DialogTitle className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-indigo-500" />
                Process Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-400 mt-0.5">
                Invoice:{" "}
                <span className="font-semibold text-indigo-500">
                  {invoice.id}
                </span>
              </DialogDescription>
            </div>

            {/* Date picker trigger */}
            <button
              type="button"
              onClick={() => setIsDatePickerOpen(true)}
              className="flex items-center gap-2.5 border border-slate-200 rounded-xl px-3.5 py-2 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left"
            >
              <CalendarDays className="h-4 w-4 text-indigo-400 flex-shrink-0" />
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider leading-none">
                  Payment Date
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {new Date(paymentDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </button>
          </div>

          <div className="flex flex-col divide-y divide-gray-100">
            {/* Patient info */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3 rounded-xl bg-indigo-50/60 border border-indigo-100 px-4 py-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                    Patient
                  </p>
                  <p className="text-sm font-bold text-slate-800">
                    {invoice.patient?.patientName || "No Patient"}
                  </p>
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="px-5 py-4 grid grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Total
                </p>
                <p className="font-bold text-gray-800 mt-0.5">
                  ₹{invoice.totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-widest">
                  Paid
                </p>
                <p className="font-bold text-emerald-700 mt-0.5">
                  ₹{invoice.amountPaid.toFixed(2)}
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-widest">
                  Balance
                </p>
                <p className="font-bold text-amber-700 mt-0.5">
                  ₹{remainingAmount.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Payment method */}
            <div className="px-5 py-4 space-y-2.5">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <CreditCard className="h-3 w-3" />
                Payment Method
              </p>
              <div className="flex flex-wrap gap-1.5">
                {paymentMethods.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentMethod(value)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      paymentMethod === value
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                        : "border-gray-200 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount input */}
            <div className="px-5 py-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  Amount Paying
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setPaymentAmountInput(remainingAmount.toString())
                  }
                  className="text-[11px] font-semibold text-white bg-emerald-500 hover:bg-emerald-600 px-2.5 py-0.5 rounded-full transition-colors"
                >
                  Pay full
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                  ₹
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={paymentAmountInput}
                  onChange={(e) =>
                    setPaymentAmountInput(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-full h-9 rounded-md border border-gray-200 bg-white pl-7 pr-3 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400"
                />
              </div>
              {balance > 0 ? (
                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="text-gray-400">Remaining after payment</span>
                  <span className="font-semibold text-amber-600 tabular-nums">
                    ₹{balance.toFixed(2)}
                  </span>
                </div>
              ) : (parseFloat(paymentAmountInput) || 0) > 0 ? (
                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="text-gray-400">Status</span>
                  <span className="font-semibold text-emerald-600">
                    Fully Paid ✓
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DatePickerDialog
        open={isDatePickerOpen}
        onOpenChange={setIsDatePickerOpen}
        value={paymentDate}
        onChange={setPaymentDate}
        title="Select Payment Date"
        disablePast={false}
      />
    </>
  );
};

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, CalendarDays, CreditCard, IndianRupee, Tag, AlertTriangle } from "lucide-react";
import { Invoice, PaymentDetails, PaymentMethod } from "@/types/invoice";
import { calculateDiscount, calculateDiscountPercentage } from "@/lib/utils/invoiceUtils";

interface InvoiceDetailsSectionProps {
  invoiceDetails: Invoice;
  paymentDetails: PaymentDetails;
  onInvoiceDetailsChange: (details: Invoice) => void;
  onPaymentDetailsChange: (details: PaymentDetails) => void;
}

export const InvoiceDetailsSection: React.FC<InvoiceDetailsSectionProps> = ({
  invoiceDetails,
  paymentDetails,
  onInvoiceDetailsChange,
  onPaymentDetailsChange,
}) => {
  const computedDiscount = calculateDiscount(paymentDetails.subTotal, paymentDetails.offer || 0);
  const [discountInput, setDiscountInput] = useState<string>(
    computedDiscount > 0 ? computedDiscount.toString() : ""
  );

  // Sync input when subTotal changes externally (services added/removed)
  useEffect(() => {
    const newComputed = calculateDiscount(paymentDetails.subTotal, paymentDetails.offer || 0);
    setDiscountInput(newComputed > 0 ? newComputed.toFixed(2) : "");
  }, [paymentDetails.subTotal]);

  // Re-clamp amountPaid whenever totalAmount changes (e.g. after discount applied)
  useEffect(() => {
    if (paymentDetails.amountPaid > paymentDetails.totalAmount) {
      onPaymentDetailsChange({ ...paymentDetails, amountPaid: paymentDetails.totalAmount });
    }
  }, [paymentDetails.totalAmount]);

  const handleDateChange = (date: string) => {
    onInvoiceDetailsChange({ ...invoiceDetails, date });
  };

  const handlePaymentMethodChange = (paymentMethod: PaymentMethod) => {
    onPaymentDetailsChange({ ...paymentDetails, paymentMethod });
  };

  // Use text input to prevent scroll-to-change; validate numeric only
  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    const value = Math.min(Math.max(0, Number(raw) || 0), paymentDetails.totalAmount);
    onPaymentDetailsChange({ ...paymentDetails, amountPaid: value });
  };

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setDiscountInput(raw);
    const rawAmount = Math.max(0, Number(raw) || 0);
    const clampedAmount = Math.min(rawAmount, paymentDetails.subTotal);
    const derivedPercentage =
      paymentDetails.subTotal > 0
        ? calculateDiscountPercentage(paymentDetails.subTotal, clampedAmount)
        : 0;
    onPaymentDetailsChange({ ...paymentDetails, offer: derivedPercentage });
  };

  const discountPct =
    Number(discountInput) > 0 && paymentDetails.subTotal > 0
      ? ((Number(discountInput) / paymentDetails.subTotal) * 100).toFixed(1)
      : null;

  return (
    <Card className="border border-indigo-100 shadow-sm">
      <CardHeader className="pb-3 border-b border-indigo-50 bg-indigo-50/40 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-indigo-700 text-base">
          <FileText className="h-4 w-4" />
          Invoice Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">

        {/* Invoice Date */}
        <div className="space-y-1.5">
          <Label htmlFor="invoiceDate" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            Invoice Date
          </Label>
          <input
            id="invoiceDate"
            type="date"
            value={new Date(invoiceDetails.date).toISOString().split("T")[0]}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Payment Method */}
        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
            Payment Method
          </Label>
          <Select value={paymentDetails.paymentMethod ?? ""} onValueChange={handlePaymentMethodChange}>
            <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Credit / Debit Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="netbanking">Net Banking</SelectItem>
              <SelectItem value="cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Paid */}
        <div className="space-y-1.5">
          <Label htmlFor="amountPaid" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <IndianRupee className="h-3.5 w-3.5 text-indigo-500" />
            Amount Paid
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
            <input
              id="amountPaid"
              type="text"
              inputMode="decimal"
              value={paymentDetails.amountPaid || ""}
              onChange={handleAmountPaidChange}
              placeholder="0.00"
              className="w-full h-9 rounded-md border border-input bg-background pl-7 pr-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {paymentDetails.totalAmount > 0 && paymentDetails.amountPaid <= paymentDetails.totalAmount && (
            <p className="text-xs text-gray-400">Max: ₹{paymentDetails.totalAmount.toFixed(2)}</p>
          )}
          {paymentDetails.totalAmount > 0 && paymentDetails.amountPaid > paymentDetails.totalAmount && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Exceeds total (₹{paymentDetails.totalAmount.toFixed(2)}). Invoice cannot be saved.
            </p>
          )}
        </div>

        {/* Discount */}
        <div className="space-y-1.5">
          <Label htmlFor="discount" className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Tag className="h-3.5 w-3.5 text-indigo-500" />
            Discount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">₹</span>
            <input
              id="discount"
              type="text"
              inputMode="decimal"
              value={discountInput}
              onChange={handleDiscountAmountChange}
              placeholder="0.00"
              className="w-full h-9 rounded-md border border-input bg-background pl-7 pr-3 py-1 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          {discountPct && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {discountPct}% discount applied
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

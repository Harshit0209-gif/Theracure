import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";
import { Invoice, PaymentDetails, PaymentMethod } from "@/types/invoice";

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
  const handleDateChange = (date: string) => {
    onInvoiceDetailsChange({ ...invoiceDetails, date });
  };

  const handlePaymentMethodChange = (paymentMethod: PaymentMethod) => {
    onPaymentDetailsChange({ ...paymentDetails, paymentMethod });
  };

  const handleAmountPaidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Number(e.target.value) || 0);
    onPaymentDetailsChange({ ...paymentDetails, amountPaid: value });
  };

  const handleOfferChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    onPaymentDetailsChange({ ...paymentDetails, offer: value });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "-" || e.key === "+" || e.key === "e" || e.key === "E") {
      e.preventDefault();
    }
  };

  return (
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
            value={new Date(invoiceDetails.date).toISOString().split("T")[0]}
            onChange={(e) => handleDateChange(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select
            value={paymentDetails.paymentMethod}
            onValueChange={handlePaymentMethodChange}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Credit/Debit Card</SelectItem>
              <SelectItem value="upi">UPI</SelectItem>
              <SelectItem value="netbanking">Net Banking</SelectItem>
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
            onChange={handleAmountPaidChange}
            onKeyDown={handleKeyDown}
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
            onChange={handleOfferChange}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="mt-1 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
          />
        </div>
      </CardContent>
    </Card>
  );
};

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PaymentMethod } from "@/types/invoice";
import { toast } from "@/components/ui/use-toast";
import { Loader2, IndianRupee } from "lucide-react";

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
  const [paymentAmount, setPaymentAmount] = useState<string>(
    remainingAmount.toString()
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    PaymentMethod.CASH
  );
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPaymentAmount(remainingAmount.toString());
      setPaymentMethod(PaymentMethod.CASH);
      setPaymentDate(new Date().toISOString().slice(0, 16));
    }
  }, [isOpen, remainingAmount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(paymentAmount);

    // Validation
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
        description: `Payment amount cannot exceed remaining balance of ₹${remainingAmount}`,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          totalAmount: invoice.totalAmount,
          alreadyPaid: invoice.amountPaid,
          due: remainingAmount,
          paymentAmount: amount,
          paymentMethod: paymentMethod,
          date: new Date(paymentDate).toISOString(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Payment Processed",
          description: `Successfully processed payment of ₹${amount} for ${invoice.patient?.patientName || "patient"}`,
        });
        onPaymentSuccess();
        onClose();
      } else {
        throw new Error(data.error || "Failed to process payment");
      }
    } catch (error) {
      console.error("Error processing payment:", error);
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-indigo-700">
            Process Payment
          </DialogTitle>
          <DialogDescription>
            Record payment for invoice #{invoice.id}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Patient Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Patient</p>
              <p className="font-semibold text-lg">
                {invoice.patient?.patientName || "No Patient"}
              </p>
            </div>

            {/* Amount Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-semibold text-lg flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {invoice.totalAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Already Paid</p>
                <p className="font-semibold text-lg flex items-center">
                  <IndianRupee className="h-4 w-4 mr-1" />
                  {invoice.amountPaid.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                Remaining Balance
              </p>
              <p className="font-bold text-2xl text-red-700 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {remainingAmount.toFixed(2)}
              </p>
            </div>

            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date & Time</Label>
              <Input
                id="paymentDate"
                type="datetime-local"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Payment Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">
                Payment Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="pl-10"
                  placeholder="Enter payment amount"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                Maximum: ₹{remainingAmount.toFixed(2)}
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) =>
                  setPaymentMethod(value as PaymentMethod)
                }
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PaymentMethod.CASH}>Cash</SelectItem>
                  <SelectItem value={PaymentMethod.CARD}>Card</SelectItem>
                  <SelectItem value={PaymentMethod.UPI}>UPI</SelectItem>
                  <SelectItem value={PaymentMethod.CHEQUE}>Cheque</SelectItem>
                  <SelectItem value={PaymentMethod.NATEBANKING}>
                    Net Banking
                  </SelectItem>
                  <SelectItem value={PaymentMethod.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

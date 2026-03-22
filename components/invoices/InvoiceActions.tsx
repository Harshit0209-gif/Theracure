import React, { useState, useCallback } from "react";
import {
  MoreHorizontal,
  Eye,
  Printer,
  Send,
  FileText,
  IndianRupee,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Invoice,
  InvoiceStatus,
  TransactionStatus,
  PaymentStatus,
} from "@/types/invoice";
import { PaymentDialog } from "./PaymentDialog";

interface InvoiceActionsProps {
  invoice: Invoice;
  onViewDetails: (invoice: Invoice) => void;
  onPrint: (invoice: Invoice) => void;
  onPaymentSuccess?: () => void;
}

export const InvoiceActions: React.FC<InvoiceActionsProps> = ({
  invoice,
  onViewDetails,
  onPrint,
  onPaymentSuccess,
}) => {
  const { toast } = useToast();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const handleSendInvoiceSms = useCallback(async () => {
    if (!invoice.patient?.phone) {
      toast({
        title: "No Phone Number",
        description: "This patient has no phone number on record.",
        variant: "destructive",
      });
      return;
    }
    setIsSendingSms(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/send-sms`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({ title: "SMS Sent", description: `Invoice link sent to ${invoice.patient.phone}.` });
      } else {
        toast({ title: "SMS Failed", description: data.error || "Could not send SMS.", variant: "destructive" });
      }
    } catch {
      toast({ title: "SMS Failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setIsSendingSms(false);
    }
  }, [invoice, toast]);

  const handleProcessPayment = useCallback((invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    toast({
      title: "Payment Successful",
      description: `Payment for Invoice #${selectedInvoiceForPayment?.id} has been processed successfully.`,
    });
    if (onPaymentSuccess) {
      onPaymentSuccess();
    }
  }, [selectedInvoiceForPayment, onPaymentSuccess]);

  const amountPaidFromTransactions = invoice.transactions
    ? parseFloat(
        invoice.transactions
          .filter((t) => t.status === TransactionStatus.SUCCESS)
          .reduce((sum, t) => sum + parseFloat(t.amount.toFixed(2)), 0)
          .toFixed(2),
      )
    : parseFloat(invoice.amountPaid.toFixed(2));

  const isDue =
    invoice.status === InvoiceStatus.DUE ||
    (invoice.totalAmount > amountPaidFromTransactions &&
      invoice.status !== InvoiceStatus.PAID);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Invoice Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onViewDetails(invoice)}>
            <Eye className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPrint(invoice)}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </DropdownMenuItem>
          {isDue && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleProcessPayment(invoice)}
                className="text-green-600 focus:text-green-600"
              >
                <IndianRupee className="h-4 w-4 mr-2" />
                Process Payment
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSendInvoiceSms}
            disabled={isSendingSms}
            className="text-indigo-600 focus:text-indigo-600"
          >
            {isSendingSms ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {isSendingSms ? "Sending..." : "Send Invoice SMS"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(
                `Invoice Details:\nID: ${invoice.id}\nPatient: ${
                  invoice.patient?.patientName || "No Patient"
                }\nDate: ${new Date(
                  invoice.date,
                ).toLocaleString()}\nAmount: ₹${invoice.totalAmount.toFixed(2)}
Status: ${invoice.status}`,
              );
              toast({
                title: "Invoice Copied",
                description: `Invoice #${invoice.id} details copied to clipboard`,
              });
            }}
          >
            <FileText className="h-4 w-4 mr-2" />
            Copy Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedInvoiceForPayment && (
        <PaymentDialog
          isOpen={paymentDialogOpen}
          onClose={() => {
            setPaymentDialogOpen(false);
            setSelectedInvoiceForPayment(null);
          }}
          invoice={selectedInvoiceForPayment}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

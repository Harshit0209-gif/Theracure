import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
  Printer,
  Send,
  FileText,
  IndianRupee,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Invoice,
  InvoiceStatus,
  invoiceStatusLabelMap,
  invoiceStatusStyles,
} from "@/types/invoice";
import { toast } from "@/components/ui/use-toast";
import { PaymentDialog } from "./PaymentDialog";

interface InvoiceTableProps {
  invoices: Invoice[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  handleViewDetails: (prescriptionId: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  page,
  totalPages,
  setPage,
  handleViewDetails,
}) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);

  const handleProcessPayment = (invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Payment Successful",
      description: `Payment for Invoice #${selectedInvoiceForPayment?.id} has been processed successfully.`,
    });
    window.location.reload();
  };

  console.log("Rendering InvoiceTable with invoices:", invoices);
  return (
    <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-indigo-700">
            <TableHead className="font-semibold text-white">
              Invoice ID
            </TableHead>
            <TableHead className="font-semibold text-white">Patient</TableHead>
            <TableHead className="font-semibold text-white">Date</TableHead>
            <TableHead className="font-semibold text-white">Amount</TableHead>
            <TableHead className="font-semibold text-white">Status</TableHead>
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
                  <p className="font-medium">{invoice.patient.patientName}</p>
                </TableCell>
                <TableCell>{new Date(invoice.date).toLocaleString()}</TableCell>
                <TableCell className="font-semibold">
                  {invoice.totalAmount}
                </TableCell>
                <TableCell>
                  <Badge
                    className={`${invoiceStatusStyles[invoice.status]?.color} `}
                  >
                    {React.createElement(
                      invoiceStatusStyles[invoice.status]?.icon,
                      {
                        className:
                          invoiceStatusStyles[invoice.status]?.className,
                      }
                    )}

                    {invoiceStatusLabelMap[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
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
                      {invoice.status === InvoiceStatus.DUE && (
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
                        </>
                      )}

                      <DropdownMenuItem
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `Invoice Details:\nID: ${invoice.id}\nPatient: ${
                              invoice.patient.patientName
                            }\nDate: ${new Date(
                              invoice.date
                            ).toLocaleString()}\nAmount: ${
                              invoice.totalAmount
                            }\nStatus: ${invoice.status}`
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
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                <div className="flex flex-col items-center space-y-2">
                  <FileText className="h-12 w-12 text-gray-300" />
                  <p className="text-lg font-medium">No invoices found</p>
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
            onClick={() => setPage(Math.max(1, page - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

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
            onClick={() => setPage(Math.min(totalPages, page + 1))}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Payment Dialog */}
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
    </div>
  );
};

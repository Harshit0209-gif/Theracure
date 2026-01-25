import React, { useState, useCallback } from "react";
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
  handleDirectPrint: (invoice: Invoice) => void;
}

export const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  page,
  totalPages,
  setPage,
  handleViewDetails,
  handleDirectPrint,
}) => {
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] =
    useState<Invoice | null>(null);

  const handleProcessPayment = useCallback((invoice: Invoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentDialogOpen(true);
  }, []);

  const handlePaymentSuccess = useCallback(() => {
    toast({
      title: "Payment Successful",
      description: `Payment for Invoice #${selectedInvoiceForPayment?.id} has been processed successfully.`,
    });
    window.location.reload();
  }, [selectedInvoiceForPayment]);

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
                  <p className="font-medium">
                    {invoice.patient?.patientName || "No Patient"}
                  </p>
                </TableCell>
                <TableCell>{new Date(invoice.date).toLocaleString()}</TableCell>
                <TableCell className="font-semibold">
                  ₹{invoice.totalAmount.toFixed(2)}
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
                      },
                    )}

                    {invoiceStatusLabelMap[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Invoice Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(invoice);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDirectPrint(invoice);
                          }}
                        >
                          <Printer className="h-4 w-4 mr-2" />
                          Print
                        </DropdownMenuItem>
                        {invoice.status === InvoiceStatus.DUE && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProcessPayment(invoice);
                              }}
                              className="text-green-600 focus:text-green-600"
                            >
                              <IndianRupee className="h-4 w-4 mr-2" />
                              Process Payment
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toast({
                                  title: "Payment reminder sent",
                                  description: `Reminder sent to ${invoice.patient?.patientName || "patient"} for payment`,
                                });
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Send Reminder
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(
                              `Invoice Details:\nID: ${invoice.id}\nPatient: ${
                                invoice.patient?.patientName || "No Patient"
                              }\nDate: ${new Date(
                                invoice.date,
                              ).toLocaleString()}\nAmount: ₹${invoice.totalAmount.toFixed(
                                2,
                              )}\nStatus: ${invoice.status}`,
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
                  </div>
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

          {(() => {
            const maxVisiblePages = 5;
            const pages: (number | string)[] = [];

            if (totalPages <= maxVisiblePages + 2) {
              // Show all pages if total is small
              for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Always show first page
              pages.push(1);

              // Calculate range around current page
              let start = Math.max(2, page - 1);
              let end = Math.min(totalPages - 1, page + 1);

              // Adjust if near beginning
              if (page <= 3) {
                start = 2;
                end = Math.min(maxVisiblePages - 1, totalPages - 1);
              }

              // Adjust if near end
              if (page >= totalPages - 2) {
                start = Math.max(2, totalPages - maxVisiblePages + 2);
                end = totalPages - 1;
              }

              // Add ellipsis after first page if needed
              if (start > 2) {
                pages.push("...");
              }

              // Add middle pages
              for (let i = start; i <= end; i++) {
                pages.push(i);
              }

              // Add ellipsis before last page if needed
              if (end < totalPages - 1) {
                pages.push("...");
              }

              // Always show last page
              pages.push(totalPages);
            }

            return pages.map((pg, index) => {
              if (pg === "...") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-gray-500"
                  >
                    ...
                  </span>
                );
              }

              return (
                <Button
                  key={pg}
                  size="sm"
                  variant={pg === page ? "default" : "outline"}
                  className={
                    pg === page
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600"
                      : "border-indigo-600 text-indigo-700 hover:bg-indigo-50"
                  }
                  onClick={() => setPage(pg as number)}
                >
                  {pg}
                </Button>
              );
            });
          })()}

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

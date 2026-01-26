import {
  Clock,
  Printer,
  User,
  FileText,
  CheckCircle,
  Activity,
  IndianRupee,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { isPrintable } from "@/lib/utils/invoiceUtils";

import { toast } from "@/components/ui/use-toast";
import {
  InvoicePayload,
  invoiceStatusLabelMap,
  invoiceStatusStyles,
  PaymentStatus,
} from "@/types/invoice";
import React from "react";

interface InvoiceDetailsModalProps {
  printPayload: InvoicePayload | null;
  isDetailsModalOpen: boolean;
  setIsDetailsModalOpen: (open: boolean) => void;
  handlePrintInvoice: () => void;
}

export const InvoiceDetailsModal = ({
  printPayload,
  isDetailsModalOpen,
  setIsDetailsModalOpen,
  handlePrintInvoice,
}: InvoiceDetailsModalProps) => {
  if (!printPayload) return;
  const isValid = isPrintable(printPayload);
  if (!isValid) {
    toast({
      title: "Missing Data",
      description: "Some invoice data is incomplete.",
      variant: "destructive",
    });
    return;
  }
  console.log("Selected Invoice for Details:", printPayload);

  return (
    <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            ID- {printPayload.invoiceDetails.id}
            <div className="text-right">
              <Badge
                className={`${
                  invoiceStatusStyles[printPayload.invoiceDetails.status]?.color
                } `}
              >
                {React.createElement(
                  invoiceStatusStyles[printPayload.invoiceDetails.status]?.icon,
                  {
                    className:
                      invoiceStatusStyles[printPayload.invoiceDetails.status]
                        ?.className,
                  }
                )}

                {invoiceStatusLabelMap[printPayload.invoiceDetails.status]}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Patient and Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4 text-indigo-600" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Patient Name</p>
                  <p className="font-semibold">
                    {printPayload.patientInfo.patientName || ""}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Patient ID</p>
                  <p className="font-semibold">{printPayload.patientInfo.id}</p>
                </div>
                {printPayload.patientInfo.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-semibold">
                      {printPayload.patientInfo.phone}
                    </p>
                  </div>
                )}
                {printPayload.patientInfo.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">
                      {printPayload.patientInfo.email}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Invoice Date</p>
                  <p className="font-semibold">
                    {new Date(
                      printPayload.invoiceDetails.date
                    ).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-semibold capitalize">
                    {printPayload.invoiceDetails.paymentMethod ||
                      "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created By</p>
                  <p className="font-semibold">
                    {printPayload.invoiceDetails.createdBy || "System"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services/Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-600" />
                Services & Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Service/Item</TableHead>
                    <TableHead className="text-center">No.of Session</TableHead>
                    <TableHead className="text-right">Rate (₹)</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printPayload.invoiceDetails.invoiceItems?.map(
                    (item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.serviceName}</p>
                            {item.description && (
                              <p className="text-sm text-gray-500">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{item.priceAtPurchase.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{(item.priceAtPurchase * item.quantity).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )
                  ) || (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-4 text-gray-500"
                      >
                        No items found for this invoice
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          {printPayload.invoiceDetails.transactions &&
            printPayload.invoiceDetails.transactions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-indigo-600" />
                    Transaction Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Transaction ID</TableHead>
                        <TableHead>Date Time</TableHead>
                        <TableHead className="text-right">Amount (₹)</TableHead>
                        <TableHead>Payment Mode</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {printPayload.invoiceDetails.transactions.map(
                        (transaction: any) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.id}
                            </TableCell>
                            <TableCell>
                              {new Date(
                                transaction.transactionDate
                              ).toLocaleString("en-IN", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              ₹{transaction.amount.toFixed(2)}
                            </TableCell>
                            <TableCell className="capitalize">
                              {transaction.paymentMethod || "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  transaction.status === "SUCCESS"
                                    ? "bg-green-100 text-green-700"
                                    : transaction.status === "PENDING"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : transaction.status === "REFUNDED"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                                }
                              >
                                {transaction.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-indigo-600" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    ₹{(printPayload.paymentDetails.subTotal || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Offer:</span>
                  <span>{printPayload.paymentDetails.offer || 0}%</span>
                </div>
                {printPayload.paymentDetails.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>
                      -₹{printPayload.paymentDetails.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>
                    ₹{(printPayload.paymentDetails.totalAmount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid:</span>
                  <span>
                    ₹{(printPayload.paymentDetails.amountPaid || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Balance Due:</span>
                  <span>
                    ₹{(printPayload.paymentDetails.balance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {printPayload.invoiceDetails.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {printPayload.invoiceDetails.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsDetailsModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handlePrintInvoice()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4 mr-2" />
            Print Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

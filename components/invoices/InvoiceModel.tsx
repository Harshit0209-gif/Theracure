import {
  Clock,
  Printer,
  User,
  FileText,
  CheckCircle,
  Activity,
  IndianRupee,
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

interface InvoiceDetailsModalProps {
  printPayload: any;
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
            ID- {printPayload.invoiceDetails.invoiceId}
            <div className="text-right">
              <Badge
                className={
                  printPayload.paymentDetails.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }
              >
                {printPayload.paymentDetails.status === "PAID" ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <Clock className="h-3 w-3 mr-1" />
                )}
                {printPayload.paymentDetails.status}
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
                    {printPayload.paymentDetails.paymentMethod ||
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
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Rate (₹)</TableHead>
                    <TableHead className="text-right">Amount (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {printPayload.selectedServices?.map(
                    (item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
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
                          ₹{item.price}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹
                          {(item.price * item.quantity).toLocaleString("en-IN")}
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
                    ₹
                    {printPayload.paymentDetails.subTotal?.toLocaleString(
                      "en-IN"
                    ) || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>offer:</span>
                  <span>
                    {printPayload.paymentDetails.offer?.toLocaleString(
                      "en-IN"
                    ) || "0"}
                    %
                  </span>
                </div>
                {printPayload.paymentDetails.subTotal > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>
                      -₹
                      {printPayload.paymentDetails.discount.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>
                    ₹
                    {printPayload.paymentDetails.totalAmount?.toLocaleString(
                      "en-IN"
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Amount Paid:</span>
                  <span>
                    ₹
                    {printPayload.paymentDetails.amountPaid?.toLocaleString(
                      "en-IN"
                    ) || "0"}
                  </span>
                </div>
                <div className="flex justify-between text-red-600 font-semibold">
                  <span>Balance Due:</span>
                  <span>
                    ₹
                    {printPayload.paymentDetails.balance.toLocaleString(
                      "en-IN"
                    )}
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

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setIsDetailsModalOpen(false)}
          >
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handlePrintInvoice()}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Invoice,
  InvoiceStatus,
  invoiceStatusLabelMap,
  invoiceStatusStyles,
} from "@/types/invoice";
import { InvoiceActions } from "./InvoiceActions";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

interface InvoiceListProps {
  invoices: Invoice[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  handleViewDetails: (invoice: Invoice) => void;
  handleDirectPrint: (invoice: Invoice) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  page,
  totalPages,
  setPage,
  handleViewDetails,
  handleDirectPrint,
}) => {
  return (
    <div className="bg-white rounded-lg overflow-hidden mb-6 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-indigo-700">
            <TableHead className="w-[120px] font-semibold text-white">
              Invoice ID
            </TableHead>
            <TableHead className="font-semibold text-white">Patient</TableHead>
            <TableHead className="font-semibold text-white">Date</TableHead>
            <TableHead className="font-semibold text-white">Amount</TableHead>
            <TableHead className="text-center font-semibold text-white">
              Status
            </TableHead>
            <TableHead className="text-right font-semibold text-white">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length > 0 ? (
            invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">{invoice.id}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {invoice.patient?.patientName || "N/A"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {invoice.patient?.email || ""}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  <div className="text-sm text-gray-500">
                    Due on:{" "}
                    {new Date(invoice.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    ₹{invoice.totalAmount.toFixed(2)}
                  </div>
                  {invoice.status !== InvoiceStatus.PAID && (
                    <div className="text-sm text-red-500">
                      Balance: ₹
                      {(invoice.totalAmount - invoice.amountPaid).toFixed(2)}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      invoice.status === InvoiceStatus.PAID
                        ? "default"
                        : "destructive"
                    }
                  >
                    {invoiceStatusLabelMap[invoice.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <InvoiceActions
                    invoice={invoice}
                    onViewDetails={handleViewDetails}
                    onPrint={handleDirectPrint}
                  />
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
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {totalPages > 1 &&
            Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
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
            onClick={() => setPage(page + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

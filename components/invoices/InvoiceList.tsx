import { FileText, type LucideIcon } from "lucide-react";
import { Invoice, InvoiceStatus, invoiceStatusLabelMap } from "@/types/invoice";
import { InvoiceActions } from "./InvoiceActions";
import { Badge } from "@/components/ui/badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

interface InvoiceListProps {
  invoices: Invoice[];
  isLoading?: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  handleViewDetails: (invoice: Invoice) => void;
  handleDirectPrint: (invoice: Invoice) => void;
  onPaymentSuccess?: () => void;
  /** Optional icon shown in the count bar. Defaults to FileText. */
  icon?: LucideIcon;
  className?: string;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-emerald-50 text-emerald-700 border-0 hover:bg-emerald-50",
    DUE: "bg-red-50 text-red-600 border-0 hover:bg-red-50",
    CANCELLED: "bg-gray-100 text-gray-500 border-0 hover:bg-gray-100",
  };
  return (
    <Badge className={styles[status] ?? "bg-gray-100 text-gray-500 border-0 hover:bg-gray-100"}>
      {invoiceStatusLabelMap[status] ?? status}
    </Badge>
  );
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  isLoading = false,
  page,
  totalPages,
  totalCount,
  pageSize,
  setPage,
  setPageSize,
  handleViewDetails,
  handleDirectPrint,
  onPaymentSuccess,
  icon: Icon = FileText,
  className,
}) => {
  const columns: DataTableColumn<Invoice>[] = [
    {
      header: "#",
      headerClassName: "w-14 text-center",
      cellClassName: "text-center text-sm text-gray-400 font-medium",
      cell: (_, index) => (page - 1) * pageSize + index + 1,
    },
    {
      header: "Invoice ID",
      cell: (invoice) => (
        <Badge className="bg-indigo-50 text-indigo-700 font-mono text-xs border-0 hover:bg-indigo-50">
          {invoice.id}
        </Badge>
      ),
    },
    {
      header: "Patient",
      cell: (invoice) => (
        <>
          <div className="font-semibold text-gray-800">
            {invoice.patient?.patientName || <span className="text-gray-400">—</span>}
          </div>
          {invoice.patient?.email && (
            <div className="text-xs text-gray-400 mt-0.5">{invoice.patient.email}</div>
          )}
        </>
      ),
    },
    {
      header: "Date",
      cellClassName: "text-gray-600 text-sm",
      cell: (invoice) =>
        new Date(invoice.date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      header: "Amount",
      cell: (invoice) => {
        const balance = invoice.totalAmount - invoice.amountPaid;
        return (
          <>
            <div className="font-semibold text-gray-800">₹{invoice.totalAmount.toFixed(2)}</div>
            {invoice.status !== InvoiceStatus.PAID && balance > 0 && (
              <div className="text-xs text-red-500 mt-0.5">Balance: ₹{balance.toFixed(2)}</div>
            )}
          </>
        );
      },
    },
    {
      header: "Status",
      headerClassName: "text-center",
      cellClassName: "text-center",
      cell: (invoice) => <StatusBadge status={invoice.status} />,
    },
    {
      header: "Actions",
      headerClassName: "text-right pr-6",
      cellClassName: "text-right pr-4",
      cell: (invoice) => (
        <InvoiceActions
          invoice={invoice}
          onViewDetails={handleViewDetails}
          onPrint={handleDirectPrint}
          onPaymentSuccess={onPaymentSuccess}
        />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={invoices}
      rowKey={(inv) => inv.id}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
      totalCount={totalCount}
      setPage={setPage}
      setPageSize={setPageSize}
      loading={isLoading}
      countIcon={<Icon className="h-5 w-5" />}
      countLabel="invoices"
      emptyIcon={<FileText className="h-10 w-10" />}
      emptyTitle="No invoices found"
      emptyDescription="Try adjusting your search or filters"
      className={className}
    />
  );
};

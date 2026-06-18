"use client";

import { useMemo, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// ─── Column definition ────────────────────────────────────────────────────────

export interface DataTableColumn<T> {
  /** Header label shown in the indigo header row */
  header: string;
  /** How to render the cell for a row. Return a ReactNode. */
  cell: (row: T, index: number) => ReactNode;
  /** Optional extra className on the <TableHead> */
  headerClassName?: string;
  /** Optional extra className on each <TableCell> */
  cellClassName?: string;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DataTableProps<T> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Current page of data to display */
  data: T[];
  /** Key extractor — used as React key for rows */
  rowKey: (row: T) => string;

  /** Pagination */
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;

  /** Loading state */
  loading?: boolean;

  /** Count bar — left side */
  countIcon?: ReactNode;
  countLabel?: string; // e.g. "appointments", "invoices", "patients"

  /** Empty state */
  emptyIcon?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;

  /** Optional row click handler */
  onRowClick?: (row: T) => void;

  /** Hide the rows-per-page selector — use for fixed-size tables like dashboard previews */
  hidePageSizeSelector?: boolean;

  /** Hide the pagination footer entirely — use when all rows are shown at once */
  hidePaginationFooter?: boolean;

  /** Optional className overrides for the outer card */
  className?: string;
}

// ─── Smart ellipsis page numbers ─────────────────────────────────────────────

function usePageNumbers(page: number, totalPages: number): (number | "...")[] {
  return useMemo(() => {
    if (totalPages <= 7)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    const add = (p: number) => {
      if (!pages.includes(p)) pages.push(p);
    };
    add(1);
    if (page > 3) pages.push("...");
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    )
      add(i);
    if (page < totalPages - 2) pages.push("...");
    add(totalPages);
    return pages;
  }, [page, totalPages]);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  rowKey,
  page,
  pageSize,
  totalPages,
  totalCount,
  setPage,
  setPageSize,
  loading = false,
  countIcon,
  countLabel = "records",
  emptyIcon,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your search or filters",
  onRowClick,
  hidePageSizeSelector = false,
  hidePaginationFooter = false,
  className = "",
}: DataTableProps<T>) {
  const pageNumbers = usePageNumbers(page, totalPages);
  const rowStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rowEnd = Math.min(page * pageSize, totalCount);
  const colSpan = columns.length;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 ${className}`}
    >
      {/* ── Count bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50 gap-3 sm:gap-0">
        <div className="flex items-center gap-2">
          {countIcon && <span className="text-indigo-500">{countIcon}</span>}
          <span className="text-sm font-semibold text-indigo-700">
            {totalCount}
          </span>
          <span className="text-sm text-gray-500">{countLabel}</span>
        </div>
        {!hidePageSizeSelector && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 whitespace-nowrap">
              Rows per page
            </span>
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPage(1);
                setPageSize(Number(val));
              }}
            >
              <SelectTrigger className="w-16 h-7 text-xs bg-white border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-indigo-700 hover:bg-indigo-700">
              {columns.map((col, i) => (
                <TableHead
                  key={i}
                  className={`text-white font-semibold whitespace-nowrap ${col.headerClassName ?? ""}`}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
                    <span className="text-sm text-gray-400">
                      Loading {countLabel}...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center py-16">
                  <div className="flex flex-col items-center gap-2">
                    {emptyIcon && (
                      <span className="text-gray-200">{emptyIcon}</span>
                    )}
                    <p className="text-base font-medium text-gray-500">
                      {emptyTitle}
                    </p>
                    <p className="text-sm text-gray-400">{emptyDescription}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => (
                <TableRow
                  key={rowKey(row)}
                  className={`hover:bg-indigo-50/40 transition-colors border-b border-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col, ci) => (
                    <TableCell key={ci} className={col.cellClassName ?? ""}>
                      {col.cell(row, index)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination footer ── */}
      {!loading && totalCount > 0 && !hidePaginationFooter && (
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50 gap-4 md:gap-0">
          <span className="text-sm text-gray-500 text-center md:text-left">
            Showing{" "}
            <span className="font-medium text-gray-700">
              {rowStart}–{rowEnd}
            </span>{" "}
            of <span className="font-medium text-gray-700">{totalCount}</span>{" "}
            {countLabel}
          </span>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {pageNumbers.map((pg, i) =>
              pg === "..." ? (
                <span
                  key={`ellipsis-${i}`}
                  className="w-8 text-center text-gray-400 text-sm"
                >
                  …
                </span>
              ) : (
                <Button
                  key={pg}
                  size="sm"
                  variant={pg === page ? "default" : "outline"}
                  className={
                    pg === page
                      ? "h-8 w-8 p-0 bg-indigo-600 hover:bg-indigo-700 border-indigo-600 text-white"
                      : "h-8 w-8 p-0 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700"
                  }
                  onClick={() => setPage(pg as number)}
                >
                  {pg}
                </Button>
              ),
            )}

            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 border-gray-200 text-gray-600 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-40"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

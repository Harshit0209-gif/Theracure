import React from "react";
import { IndianRupee, TrendingDown, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/stats/stats-section";
import { formatCurrency } from "@/lib/utils/utils";

interface Props {
  revenueStatus: any;
  isLoading: any;
  error: any;
}

export function InvoiceStatsCards({ revenueStatus, isLoading, error }: Props) {
  const formatGrowth = (
    percentage: number,
    isPositive: boolean,
  ): React.ReactNode => {
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-500" : "text-red-500";
    const prefix = isPositive ? "↑" : "↓";
    return (
      <span className={`text-xs ${color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {prefix} {Math.round(Math.abs(percentage))}% from last period
      </span>
    );
  };

  const d = revenueStatus;

  // Build a readable period label e.g. "Mar 2026" or "1 Mar – 30 Mar"
  const periodLabel = d?.period
    ? (() => {
        const start = new Date(d.period.start);
        const end = new Date(d.period.end);
        const sameMonth =
          start.getMonth() === end.getMonth() &&
          start.getFullYear() === end.getFullYear();
        return sameMonth
          ? start.toLocaleDateString("en-IN", {
              month: "short",
              year: "numeric",
            })
          : `${start.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
      })()
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card 1: Total Billed — sum of totalAmount for all non-cancelled invoices */}
      <StatsCard
        title="Total Billed"
        value={d?.revenue ? formatCurrency(d.revenue.thisMonth) : "₹0"}
        subtitle={
          d?.revenue ? (
            <span className="flex flex-col gap-0.5 mt-1">
              <span className="text-xs text-gray-500">
                {periodLabel && (
                  <span className="font-medium">{periodLabel} &middot; </span>
                )}
                {d.totalInvoices} invoice{d.totalInvoices !== 1 ? "s" : ""}{" "}
                &middot; {Math.round(d.collectionRate)}% collected
              </span>
              {formatGrowth(
                d.revenue.growthPercentage,
                d.revenue.isGrowthPositive,
              )}
            </span>
          ) : (
            "Loading..."
          )
        }
        icon={<IndianRupee className="h-6 w-6 text-orange-600" />}
        bgColor="bg-orange-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />

      {/* Card 2: Amount Collected — sum of amountPaid across all non-cancelled invoices */}
      <StatsCard
        title="Amount Collected"
        value={d?.paidRevenue ? formatCurrency(d.paidRevenue.thisMonth) : "₹0"}
        subtitle={
          d?.paidRevenue ? (
            <span className="flex flex-col gap-0.5 mt-1">
              <span className="text-xs text-gray-500">
                {d.paidInvoices} fully paid &middot; {d.partiallyPaidInvoices}{" "}
                partial
              </span>
              {formatGrowth(
                d.paidRevenue.growthPercentage,
                d.paidRevenue.isGrowthPositive,
              )}
            </span>
          ) : (
            "Loading..."
          )
        }
        icon={<IndianRupee className="h-6 w-6 text-green-600" />}
        bgColor="bg-green-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />

      {/* Card 3: Balance Due — remaining unpaid amount on DUE invoices */}
      <StatsCard
        title="Balance Due"
        value={d?.dueAmount ? formatCurrency(d.dueAmount.thisMonth) : "₹0"}
        subtitle={
          d?.dueAmount ? (
            <span className="flex flex-col gap-0.5 mt-1">
              <span className="text-xs text-gray-500">
                {d.dueInvoices} unpaid invoice{d.dueInvoices !== 1 ? "s" : ""}{" "}
                &middot; {Math.round(d.paymentCompletionRate)}% completion
              </span>
              {formatGrowth(
                d.dueAmount.growthPercentage,
                d.dueAmount.isGrowthPositive,
              )}
            </span>
          ) : (
            "Loading..."
          )
        }
        icon={<IndianRupee className="h-6 w-6 text-amber-600" />}
        bgColor="bg-amber-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />
    </div>
  );
}

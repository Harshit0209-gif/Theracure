import { IndianRupee, TrendingDown, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/stats/stats-section";
import { formatCurrency } from "@/lib/utils/utils";

interface Props {
  revenueStatus: any;
  isLoading: any;
  error: any;
}

export function InvoiceStatsCards({ revenueStatus, isLoading, error }: Props) {
  const formatGrowthPercentage = (
    percentage: number,
    isPositive: boolean,
    label = "from last month"
  ): React.ReactNode => {
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? "text-green-500" : "text-red-500";
    const prefix = isPositive ? "↑" : "↓";

    return (
      <p className={`text-xs ${color} mt-1 flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {prefix} {Math.abs(percentage).toFixed(1)}% {label}
      </p>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatsCard
        title="Total Revenue"
        value={
          revenueStatus?.revenue
            ? formatCurrency(revenueStatus.revenue.thisMonth)
            : "₹0"
        }
        subtitle={
          revenueStatus?.revenue
            ? formatGrowthPercentage(
                revenueStatus.revenue.growthPercentage,
                revenueStatus.revenue.isGrowthPositive
              )
            : "Loading..."
        }
        icon={<IndianRupee className="h-6 w-6 text-orange-600" />}
        bgColor="bg-orange-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />

      <StatsCard
        title="Paid Invoices"
        value={
          revenueStatus?.paidRevenue
            ? formatCurrency(revenueStatus.paidRevenue.thisMonth)
            : "₹0"
        }
        subtitle={
          revenueStatus?.paidRevenue
            ? formatGrowthPercentage(
                revenueStatus.paidRevenue.growthPercentage,
                revenueStatus.paidRevenue.isGrowthPositive
              )
            : "Loading..."
        }
        icon={<IndianRupee className="h-6 w-6 text-green-600" />}
        bgColor="bg-green-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />

      <StatsCard
        title="Pending Payments"
        value={
          revenueStatus?.dueAmount
            ? formatCurrency(revenueStatus.dueAmount.thisMonth)
            : "₹0"
        }
        subtitle={
          revenueStatus?.dueAmount
            ? formatGrowthPercentage(
                revenueStatus.dueAmount.growthPercentage,
                revenueStatus.dueAmount.isGrowthPositive
              )
            : "Loading..."
        }
        icon={<IndianRupee className="h-6 w-6 text-amber-600" />}
        bgColor="bg-amber-100"
        isLoading={isLoading.revenue}
        error={error.revenue}
      />
    </div>
  );
}

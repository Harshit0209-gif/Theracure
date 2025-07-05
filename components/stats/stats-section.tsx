import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle: React.ReactNode;
  icon: React.ReactNode;
  bgColor: string;
  isLoading?: boolean;
  error?: boolean;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  bgColor,
  isLoading = false,
  error = false,
}) => {
  if (isLoading) {
    return (
      <Card className="bg-white shadow-sm animate-pulse">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-500">{title}</p>
              <h3 className="text-2xl font-bold mt-1 text-red-700">--</h3>
              <p className="text-xs text-red-500 mt-1">Error loading data</p>
            </div>
            <div
              className={`h-12 w-12 ${bgColor} rounded-full flex items-center justify-center opacity-50`}
            >
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">
              {typeof value === "number"
                ? value.toLocaleString("en-IN")
                : value}
            </h3>
            <div className="mt-1">{subtitle}</div>
          </div>
          <div
            className={`h-12 w-12 ${bgColor} rounded-full flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AssessmentSectionProps {
  title: string;
  icon: React.ReactNode;
  data: any;
  isObject?: boolean;
}

export const AssessmentSection: React.FC<AssessmentSectionProps> = ({
  title,
  icon,
  data,
  isObject = false,
}) => {
  const hasData = () => {
    if (isObject) {
      return (
        data &&
        Object.values(data).some((value: any) => {
          if (typeof value === "string") return value.trim() !== "";
          if (typeof value === "number") return value !== 0;
          return value !== null && value !== undefined;
        })
      );
    }
    if (typeof data === "string") return data.trim() !== "";
    if (typeof data === "number") return data !== 0;
    return data !== null && data !== undefined;
  };

  if (!hasData()) {
    return null;
  }

  const formatFieldName = (key: string) => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isObject ? (
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]: [string, any]) => {
              // Skip empty values
              if (
                !value ||
                (typeof value === "string" && value.trim() === "") ||
                (typeof value === "number" && value === 0)
              ) {
                return null;
              }

              return (
                <div key={key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    {formatFieldName(key)}:
                  </span>
                  <span className="text-gray-900 text-right max-w-xs">
                    {typeof value === "number" ? value : value}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{data}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

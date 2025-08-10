import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ChevronUp, ChevronDown } from "lucide-react";
import { SectionConfig } from "@/types/section";

interface SectionCardProps {
  section: SectionConfig;
  children: React.ReactNode;
  onToggle: () => void;
  onExpand: () => void;
  isActive: boolean;
  isExpanded: boolean;
  isRequired: boolean;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  children,
  onToggle,
  onExpand,
  isActive,
  isExpanded,
  isRequired,
}) => {
  const IconComponent = section.icon;

  return (
    <Card
      className={`${
        isRequired
          ? "border-l-4 border-l-blue-500 bg-blue-50/30"
          : "border border-gray-200"
      }`}
    >
      <CardHeader
        className={`${!isRequired ? "cursor-pointer" : ""} pb-3`}
        onClick={() => !isRequired && onExpand()}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <IconComponent
              className={`h-4 w-4 ${
                isRequired ? "text-blue-600" : "text-gray-600"
              }`}
            />
            {section.name}
            {isRequired && (
              <Badge variant="secondary" className="text-xs">
                Required
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isRequired && (
              <Switch
                checked={isActive}
                onCheckedChange={onToggle}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {!isRequired &&
              (isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              ))}
          </div>
        </div>
      </CardHeader>

      {(isExpanded || isRequired) && (
        <CardContent className="pt-0">{children}</CardContent>
      )}
    </Card>
  );
};

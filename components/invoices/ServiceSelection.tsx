import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Check,
  Plus,
  Minus,
  Activity,
  LucideIcon,
  Filter,
} from "lucide-react";
import { Service, SelectedService, PurchasedService } from "@/types/service";
import { ServiceCategoryOptionsMap, AllServiceCatagory } from "@/lib/service";

interface ServiceSelectionProps {
  services: Service[] | null;
  selectedServices: PurchasedService[];
  isServicesLoading: boolean;
  addService: (service: PurchasedService) => void;
  removeService: (serviceId: string) => void;
  updateServiceQuantity: (serviceId: string, quantity: number) => void;
}

const ServiceCard: React.FC<{
  service: Service;
  isSelected: boolean;
  quantity: number;
  colors: (typeof ServiceCategoryOptionsMap)[keyof typeof ServiceCategoryOptionsMap]["colors"];
  onToggle: () => void;
  onQuantityChange: (quantity: number) => void;
}> = ({
  service,
  isSelected,
  quantity,
  colors,
  onToggle,
  onQuantityChange,
}) => {
  return (
    <div
      className={`group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden cursor-pointer ${
        isSelected
          ? "border-indigo-200 shadow-md"
          : "border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100"
      }`}
      onClick={onToggle}
    >
      {/* Selected Indicator Bar */}
      {isSelected && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-indigo-600" />
      )}

      <div className="p-4">
        {/* Header with Checkbox */}
        <div className="flex items-start justify-between mb-3">
          <div
            className={`p-2 rounded-lg ${colors.bg} ${colors.text}`}
          >
            <Check className="h-4 w-4" />
          </div>
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
              isSelected
                ? `${colors.selectedBg} border-transparent`
                : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && <Check className="h-3 w-3 text-white" />}
          </div>
        </div>

        {/* Service Name */}
        <div className="mb-2">
          <h4 className="font-bold text-gray-800 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
            {service.name}
          </h4>
        </div>

        {/* Description */}
        <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2 min-h-[2rem] mb-3">
          {service.description || "Medical service specialized for therapeutic care."}
        </p>

        {/* Price and Total */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-baseline gap-1">
            <span className="text-[10px] font-semibold text-gray-400">₹</span>
            <span className="text-base font-bold text-gray-900 tracking-tight">
              {service.price.toLocaleString("en-IN")}
            </span>
          </div>
          {isSelected && (
            <div
              className={`${colors.bg} border-2 ${colors.border} text-[9px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1 ${colors.text}`}
            >
              <Check className="h-2.5 w-2.5" />
              Added
            </div>
          )}
        </div>

        {/* Quantity Controls */}
        {isSelected && (
          <div
            className="mt-3 pt-3 border-t border-gray-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600">Qty:</span>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-6 w-6 p-0 border-gray-200 hover:bg-gray-100`}
                  onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-3 w-3 text-gray-600" />
                </Button>
                <span className="w-6 text-center font-semibold text-gray-800 text-sm">
                  {quantity}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className={`h-6 w-6 p-0 border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600`}
                  onClick={() => onQuantityChange(quantity + 1)}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-2 text-xs bg-indigo-50/50 rounded-lg px-2 py-1.5">
              <span className="text-gray-600 font-medium">Total:</span>
              <span className="font-bold text-indigo-600">
                ₹{(service.price * quantity).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ServiceCategory: React.FC<{
  title: string;
  icon: LucideIcon;
  services: Service[];
  selectedServices: PurchasedService[];
  colors: (typeof ServiceCategoryOptionsMap)[keyof typeof ServiceCategoryOptionsMap]["colors"];
  onServiceToggle: (service: Service, isSelected: boolean) => void;
  onQuantityChange: (serviceId: string, quantity: number) => void;
}> = ({
  title,
  icon,
  services,
  selectedServices,
  colors,
  onServiceToggle,
  onQuantityChange,
}) => {
  const Icon = icon;

  if (services.length === 0) {
    return null;
  }
  return (
    <div className="space-y-4">
      <div
        className={`flex items-center gap-2 px-4 py-3 rounded-lg border ${colors.bg} ${colors.border} ${colors.text}`}
      >
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs font-medium">
          {services.length}
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {services.map((service) => {
          const selectedService = selectedServices.find(
            (s) => s.id === service.id,
          );
          const isSelected = !!selectedService;
          const quantity = selectedService?.quantity || 0;

          return (
            <ServiceCard
              key={service.id}
              service={service}
              isSelected={isSelected}
              quantity={quantity}
              colors={colors}
              onToggle={() => onServiceToggle(service, isSelected)}
              onQuantityChange={(qty) => onQuantityChange(service.id, qty)}
            />
          );
        })}
      </div>
    </div>
  );
};

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({
  services,
  selectedServices,
  isServicesLoading,
  addService,
  removeService,
  updateServiceQuantity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleServiceToggle = (service: any, isSelected: boolean) => {
    if (isSelected) {
      removeService(service.id);
    } else {
      addService(service);
    }
  };

  if (isServicesLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const allCategories = Object.values(ServiceCategoryOptionsMap);
  const visibleCategories = selectedCategory
    ? allCategories.filter((cat) => cat.value === selectedCategory)
    : allCategories;

  const hasServicesInCategories = visibleCategories.some((cat) =>
    services?.some((s) => s.category === cat.value)
  );

  return (
    <Card className="border-gray-100 shadow-sm">
      <CardHeader className="border-b border-gray-100 pb-4">
        <div className="flex flex-col gap-4">
          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl text-gray-800">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <Activity className="h-5 w-5" />
                </div>
                Available Services
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Select and add services to your invoice
              </p>
            </div>
            <Badge variant="outline" className="text-indigo-600 px-3 py-1 text-sm font-semibold">
              {selectedServices.length} Selected
            </Badge>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-600">
              <Filter className="h-4 w-4" />
              Filter:
            </div>
            <Button
              size="sm"
              variant={selectedCategory === null ? "default" : "outline"}
              onClick={() => setSelectedCategory(null)}
              className={`rounded-full text-xs font-medium transition-all ${
                selectedCategory === null
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
              }`}
            >
              All ({services?.length || 0})
            </Button>
            {allCategories.map((cat) => {
              const categoryCount =
                services?.filter((s) => s.category === cat.value).length || 0;
              if (categoryCount === 0) return null;

              return (
                <Button
                  key={cat.value}
                  size="sm"
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                    selectedCategory === cat.value
                      ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                      : "border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  {cat.label} ({categoryCount})
                </Button>
              );
            })}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {!hasServicesInCategories ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              No services available in this category
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {visibleCategories.map(({ value, label, icon, colors }) => {
              const categoryServices =
                services?.filter((s) => s.category === value) || [];

              if (categoryServices.length === 0) return null;

              return (
                <ServiceCategory
                  key={value}
                  title={label}
                  icon={icon}
                  services={categoryServices}
                  selectedServices={selectedServices}
                  colors={colors}
                  onServiceToggle={handleServiceToggle}
                  onQuantityChange={updateServiceQuantity}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

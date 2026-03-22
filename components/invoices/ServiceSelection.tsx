import React from "react";
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
} from "lucide-react";
import { Service, SelectedService, PurchasedService } from "@/types/service";
import { ServiceCategoryOptionsMap } from "@/lib/service";

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
      className={`relative border-2 rounded-lg p-3 transition-all duration-200 cursor-pointer ${
        isSelected
          ? `${colors.border} ${colors.bg} shadow-md`
          : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"
      }`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <div className="absolute top-2 right-2">
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
            isSelected
              ? `${colors.selectedBg} border-transparent`
              : "border-gray-300"
          }`}
        >
          {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
        </div>
      </div>

      {/* Service Content */}
      <div className="pr-6">
        <h4
          className={`font-semibold text-sm mb-1 ${
            isSelected ? colors.text : "text-gray-800"
          }`}
        >
          {service.name}
        </h4>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {service.description}
        </p>
        <div className="flex items-center justify-between">
          <p
            className={`text-sm font-bold ${
              isSelected ? colors.text : "text-gray-700"
            }`}
          >
            ₹{service.price.toFixed(2)}
          </p>
          {isSelected && (
            <Badge
              className={`${colors.selectedBg} text-white text-xs py-0 px-1`}
            >
              Added
            </Badge>
          )}
        </div>
      </div>

      {/* Quantity Controls */}
      {isSelected && (
        <div
          className={`mt-2 pt-2 border-t ${colors.border}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${colors.text}`}>Qty:</span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                className={`h-5 w-5 p-0 ${colors.border} ${colors.text}`}
                onClick={() => onQuantityChange(quantity - 1)}
              >
                <Minus className="h-2.5 w-2.5" />
              </Button>
              <span
                className={`w-5 text-center font-semibold ${colors.text} text-xs`}
              >
                {quantity}
              </span>
              <Button
                size="sm"
                variant="outline"
                className={`h-5 w-5 p-0 ${colors.border} ${colors.text}`}
                onClick={() => onQuantityChange(quantity + 1)}
              >
                <Plus className="h-2.5 w-2.5" />
              </Button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs">
            <span className="text-gray-600">Total:</span>
            <span className={`font-bold ${colors.text}`}>
              ₹{(service.price * quantity).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const ServiceCategory: React.FC<{
  title: string;
  icon: LucideIcon;
  services: Service[];
  selectedServices: SelectedService[];
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
    <div className="space-y-3">
      <div
        className={`flex items-center gap-2 p-3 rounded-lg ${colors.bg} ${colors.border} ${colors.text}`}
      >
        <Icon className="h-4 w-4" />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant="secondary" className="ml-auto text-xs">
          {services.length} services
        </Badge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {services.map((service) => {
          const selectedService = selectedServices.find(
            (s) => s.id === service.id
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" />
            Available Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Available Services
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Select services to add to the invoice
            </p>
          </div>
          <Badge variant="outline" className="text-indigo-600">
            {selectedServices.length} Selected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {Object.values(ServiceCategoryOptionsMap).map(
            ({ value, label, icon, colors }) => {
              const categoryServices =
                services?.filter((s) => s.category === value) || [];

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
            }
          )}
        </div>
      </CardContent>
    </Card>
  );
};

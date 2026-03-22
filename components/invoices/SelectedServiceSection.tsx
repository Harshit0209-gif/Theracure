import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { PaymentDetails } from "@/types/invoice";
import { SelectedService } from "@/types/service";

interface SelectedServicesSectionProps {
  selectedServices: SelectedService[];
  paymentDetails: PaymentDetails;
  onQuantityChange: (serviceId: string, quantity: number) => void;
  onRemoveService: (serviceId: string) => void;
}

export const SelectedServicesSection: React.FC<
  SelectedServicesSectionProps
> = ({
  selectedServices,
  paymentDetails,
  onQuantityChange,
  onRemoveService,
}) => {
  if (selectedServices.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Selected Services</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {selectedServices.map((service) => (
            <div
              key={service.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex-1">
                <h4 className="font-semibold">{service.name}</h4>
                <p className="text-sm text-gray-600">
                  ₹{service.price.toFixed(2)} per session
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onQuantityChange(service.id, service.quantity - 1)
                    }
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center font-semibold">
                    {service.quantity}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onQuantityChange(service.id, service.quantity + 1)
                    }
                    className="h-8 w-8 p-0"
                  >
                    +
                  </Button>
                </div>
                <div className="text-right min-w-[80px]">
                  <p className="font-bold">
                    ₹{(service.price * service.quantity).toFixed(2)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveService(service.id)}
                  className="text-red-500 hover:text-red-700 h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between font-bold text-base">
          <span>Subtotal</span>
          <span>₹{paymentDetails.subTotal.toFixed(2)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

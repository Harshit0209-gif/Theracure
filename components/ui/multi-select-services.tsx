"use client";

import { useMemo, useState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils/utils";
import { ServiceCategoryLabel } from "@/lib/service";

export interface MultiSelectServiceOption {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface MultiSelectServicesProps {
  services: MultiSelectServiceOption[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelectServices({
  services,
  selectedIds,
  onChange,
  placeholder = "Select services...",
  disabled,
}: MultiSelectServicesProps) {
  const [open, setOpen] = useState(false);

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.includes(s.id)),
    [services, selectedIds],
  );

  const groupedByCategory = useMemo(() => {
    const groups = new Map<string, MultiSelectServiceOption[]>();
    services.forEach((service) => {
      const list = groups.get(service.category) || [];
      list.push(service);
      groups.set(service.category, list);
    });
    return groups;
  }, [services]);

  const toggleService = (serviceId: string) => {
    if (selectedIds.includes(serviceId)) {
      onChange(selectedIds.filter((id) => id !== serviceId));
    } else {
      onChange([...selectedIds, serviceId]);
    }
  };

  const removeService = (serviceId: string) => {
    onChange(selectedIds.filter((id) => id !== serviceId));
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between font-normal bg-slate-50 border-slate-200 h-11 hover:border-indigo-300 transition-colors"
          >
            <span
              className={cn(
                "truncate text-left",
                selectedServices.length === 0 && "text-slate-400",
              )}
            >
              {selectedServices.length > 0
                ? `${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""} selected`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[--radix-popover-trigger-width] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search services..." />
            <CommandList>
              <CommandEmpty>No services found.</CommandEmpty>
              {[...groupedByCategory.entries()].map(
                ([category, categoryServices]) => (
                  <CommandGroup
                    key={category}
                    heading={
                      ServiceCategoryLabel[
                        category as keyof typeof ServiceCategoryLabel
                      ] || category
                    }
                  >
                    {categoryServices.map((service) => {
                      const isSelected = selectedIds.includes(service.id);
                      return (
                        <CommandItem
                          key={service.id}
                          value={`${service.name} ${category}`}
                          onSelect={() => toggleService(service.id)}
                          className="cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            className="mr-2 pointer-events-none"
                          />
                          <span className="flex-1">{service.name}</span>
                          <span className="text-xs text-slate-400 font-semibold">
                            ₹{service.price}
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                ),
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedServices.map((service) => (
            <Badge
              key={service.id}
              variant="secondary"
              className="bg-indigo-50 text-indigo-700 border-indigo-100 pl-2 pr-1 py-1 gap-1"
            >
              {service.name}
              <button
                type="button"
                onClick={() => removeService(service.id)}
                aria-label={`Remove ${service.name}`}
                className="rounded-full hover:bg-indigo-200/60 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

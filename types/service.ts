import { ServiceCategory } from "@/lib/generated/serviceEnums";

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PurchasedService extends Service {
  quantity: number;
}

export interface SelectedService extends Service {
  quantity: number;
}

export type CreateService = Omit<Service, "id" | "createdAt" | "updatedAt">;

export type UpdateService = Partial<Omit<Service, "id">> & { id: string };

export type CreatePurchasedService = Omit<PurchasedService, "id">;

export type UpdatePurchasedService = Partial<Omit<PurchasedService, "id">> & {
  id: string;
};

export const defaultService: Service = {
  id: "",
  name: "",
  description: "",
  price: 0,
  category: ServiceCategory.CONSULTATION,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const defaultPurchasedService: PurchasedService = {
  ...defaultService,
  quantity: 0,
};

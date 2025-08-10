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

export interface PurchasedService {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ServiceCategory;
  isActive: boolean;
  quantity: number;
}

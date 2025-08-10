import { PurchasedService } from "@/types/service";

export interface InvoiceDetails {
  invoiceId: string;
  date: string;
  notes: string;
  createdBy: string;
}

export interface InvoicePayload {
  invoiceDetails: InvoiceDetails;
  patientInfo: PatientInfo;
  paymentDetails: PaymentDetails;
  selectedServices: PurchasedService[];
  createdBy?: string;
  type: "invoice";
}

export interface InvoiceItem {
  invoiceId: string;
  serviceId: string;
  serviceName: string;
  priceAtPurchase: number;
  quantity: number;
  description: string;
  category: string;
}

export interface PatientInfo {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  address: string;
}

export interface PaymentDetails {
  totalAmount: number;
  amountPaid: number;
  subTotal: number;
  offer: number;
  discount: number;
  balance: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patient: PatientInfo;
  date: string;
  subTotal: number;
  totalAmount: number;
  amountPaid: number;
  status: string;
  paymentMethod?: string | null;
  notes?: string;
  offer: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  invoiceItems: InvoiceItem[];
}

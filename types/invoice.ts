import { PurchasedService, Service } from "@/types/service";
import { defaultPatient, Patient } from "./patient";
import { JSX } from "react";
import { CheckCircle, Clock, LucideIcon } from "lucide-react";

export enum PaymentStatus {
  PENDING = "Pending",
  PAID = "Paid",
  PARTIAL = "Partial",
  FAILED = "Failed",
}

export enum PaymentMethod {
  CASH = "Cash",
  CARD = "Card",
  UPI = "Upi",
  CHEQUE = "Cheque",
  NATEBANKING = "Net Banking",
  OTHER = "Other",
}

export enum TransactionStatus {
  SUCCESS = "Success",
  FAILED = "Failed",
  PENDING = "Pending",
  REFUNDED = "Refunded",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  DUE = "DUE",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}

export const invoiceStatusLabelMap: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  DUE: "Due",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

export const invoiceStatusStyles: Record<
  string,
  { color: string; icon: LucideIcon; className: string }
> = {
  PAID: {
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
    className: "h-3 w-3 mr-1",
  },
  DUE: {
    color: "bg-red-100 text-red-700",
    icon: Clock,
    className: "h-3 w-3 mr-1",
  },
  CANCELLED: {
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
    className: "h-3 w-3 mr-1",
  },
};

export interface InvoicePayload {
  invoiceDetails: Invoice;
  patientInfo: Patient;
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

export interface Transaction {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: string | null;
  transactionDate: string;
  status: TransactionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentDetails {
  totalAmount: number;
  amountPaid: number;
  subTotal: number;
  offer: number;
  discount: number;
  balance: number;
  status: PaymentStatus;
}

export interface Invoice {
  id: string;
  patientId: string;
  patient: Patient;
  date: string;
  subTotal: number;
  totalAmount: number;
  amountPaid: number;
  status: InvoiceStatus;
  paymentMethod?: PaymentMethod | null;
  notes?: string;
  offer: number | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  invoiceItems: InvoiceItem[];
  transactions?: Transaction[];
}

export type NewInvoice = Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
  invoiceItems: Omit<InvoiceItem, "invoiceId">[];
};

export const defaultInvoice: Invoice = {
  id: "",
  patientId: "",
  patient: defaultPatient,
  date: new Date().toISOString(),
  subTotal: 0,
  totalAmount: 0,
  amountPaid: 0,
  status: InvoiceStatus.DRAFT,
  paymentMethod: null,
  notes: "",
  offer: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: "",
  invoiceItems: [],
  transactions: [],
};

export const defaultPaymentDetails: PaymentDetails = {
  totalAmount: 0,
  subTotal: 0,
  amountPaid: 0,
  discount: 0,
  offer: 0,
  balance: 0,
  status: PaymentStatus.PENDING,
};

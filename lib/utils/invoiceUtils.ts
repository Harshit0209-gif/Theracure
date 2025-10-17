import {
  InvoicePayload,
  Invoice,
  PaymentMethod,
  PaymentDetails,
  TransactionStatus,
} from "@/types/invoice";
import { PurchasedService, SelectedService } from "@/types/service";
import { Patient } from "@prisma/client";

// Calculate subtotal by rounding each line item first, then summing
// This prevents floating point precision drift
export const calculateSubtotal = (services: PurchasedService[]) =>
  parseFloat(
    services
      .reduce((sum, s) => {
        // Round each item's total before adding to prevent precision drift
        const itemTotal = parseFloat((s.price * s.quantity).toFixed(2));
        return sum + itemTotal;
      }, 0)
      .toFixed(2)
  );

// Calculate discount amount from percentage
// Using division by 100 instead of multiplication by 0.01 for better precision
export const calculateDiscount = (subTotal: number, offer: number) =>
  parseFloat(((subTotal * offer) / 100).toFixed(2));

// Calculate total amount after discount
export const calculateTotal = (subTotal: number, discount: number) =>
  parseFloat((subTotal - discount).toFixed(2));

// Calculate balance due
export const calculateBalance = (total: number, paid: number) =>
  parseFloat((total - paid).toFixed(2));

// Helper function to format currency to 2 decimal places
export const formatCurrency = (amount: number): number =>
  parseFloat(amount.toFixed(2));

export const isPrintable = (payload: InvoicePayload): boolean => {
  // Check if patient info and invoice details exist
  const hasPatientInfo = !!payload?.patientInfo?.id;
  const hasInvoiceId = !!payload?.invoiceDetails?.id;

  // Check for items - can be either invoiceItems (existing invoice) or selectedServices (new invoice)
  const hasInvoiceItems =
    Array.isArray(payload.invoiceDetails?.invoiceItems) &&
    payload.invoiceDetails.invoiceItems.length > 0;

  const hasSelectedServices =
    Array.isArray(payload.selectedServices) &&
    payload.selectedServices.length > 0;

  return hasPatientInfo && hasInvoiceId && (hasInvoiceItems || hasSelectedServices);
};

export const mapInvoiceToPrintPayload = (
  invoice: Invoice,
  paymentDetails: PaymentDetails
): InvoicePayload => {
  // Calculate total amount paid from transactions with 2 decimal accuracy
  // Round each transaction before summing to prevent floating point precision drift
  const amountPaidFromTransactions = invoice.transactions
    ? formatCurrency(
        invoice.transactions
          .filter((t) => t.status === TransactionStatus.SUCCESS)
          .reduce((sum, t) => {
            const transactionAmount = parseFloat(t.amount.toFixed(2));
            return sum + transactionAmount;
          }, 0)
      )
    : 0;

  // Calculate the actual discount amount based on offer percentage
  const discountAmount = calculateDiscount(invoice.subTotal, invoice.offer || 0);

  // Ensure all monetary values have 2 decimal precision
  const finalAmountPaid = formatCurrency(amountPaidFromTransactions || invoice.amountPaid);
  const subTotal = formatCurrency(invoice.subTotal);
  const totalAmount = formatCurrency(invoice.totalAmount);

  return {
    invoiceDetails: {
      id: invoice.id,
      patientId: invoice.patientId,
      patient: invoice.patient,
      date: invoice.date,
      subTotal: subTotal,
      totalAmount: totalAmount,
      amountPaid: finalAmountPaid,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod,
      notes: invoice.notes || "",
      offer: invoice.offer,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      createdBy: invoice.createdBy,
      invoiceItems: invoice.invoiceItems,
      transactions: invoice.transactions || [],
    },
    patientInfo: invoice.patient,
    paymentDetails: {
      totalAmount: totalAmount,
      amountPaid: finalAmountPaid,
      subTotal: subTotal,
      offer: invoice.offer || 0,
      discount: discountAmount,
      balance: calculateBalance(totalAmount, finalAmountPaid),
      status: paymentDetails.status,
    },
    selectedServices: invoice.invoiceItems.map((item: any) => ({
      id: item.serviceId,
      name: item.serviceName,
      price: formatCurrency(item.priceAtPurchase),
      quantity: item.quantity,
      isActive: true,
      description: item.description || "",
      category: item.category || "General",
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || new Date().toISOString(),
    })),
    createdBy: invoice.createdBy,
    type: "invoice",
  };
};

// Alias for backward compatibility
export const mapInvoiceToPayload = mapInvoiceToPrintPayload;

import { InvoicePayload, Service, Invoice } from "@/types/invoice";

export const calculateSubtotal = (services: Service[]) =>
  parseFloat(
    services.reduce((sum, s) => sum + s.price * s.quantity, 0).toFixed(2)
  );

export const calculateDiscount = (subTotal: number, offer: number) =>
  parseFloat((subTotal * offer * 0.01).toFixed(2));

export const calculateTotal = (subTotal: number, discount: number) =>
  parseFloat((subTotal - discount).toFixed(2));

export const calculateBalance = (total: number, paid: number) =>
  parseFloat((total - paid).toFixed(2));

export const isPrintable = (payload: InvoicePayload): boolean => {
  return !!(
    payload?.patientInfo?.id &&
    Array.isArray(payload.selectedServices) &&
    payload.selectedServices.length > 0
  );
};

export const mapInvoiceToPayload = (invoice: Invoice): InvoicePayload => {
  return {
    invoiceDetails: {
      invoiceId: invoice.id,
      date: invoice.date,
      notes: invoice.notes || "",
      createdBy: invoice.createdBy,
    },
    patientInfo: invoice.patient,
    paymentDetails: {
      subTotal: invoice.subTotal,
      offer: invoice.offer || 0,
      discount: calculateDiscount(invoice.subTotal, invoice.offer || 0),
      totalAmount: invoice.totalAmount,
      amountPaid: invoice.amountPaid,
      balance: calculateBalance(invoice.totalAmount, invoice.amountPaid),
      paymentMethod: invoice.paymentMethod || "cash",
      paymentDate: invoice.date,
      status: invoice.status,
    },
    selectedServices: invoice.invoiceItems.map((item: any) => ({
      id: item.serviceId,
      name: item.serviceName,
      price: item.priceAtPurchase,
      quantity: item.quantity,
      isActive: true,
      description: item.description || "",
      category: item.category || "unknown",
    })),
    createdBy: invoice.createdBy,
    type: "invoice",
  };
};

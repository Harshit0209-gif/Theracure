import { InvoicePayload } from "@/types/invoice";

export const saveInvoice = async (data: InvoicePayload) => {
  console.log("Saving invoice with data:", data);
  const res = await fetch("/api/invoices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return await res.json();
};

export const printInvoice = async (payload: InvoicePayload) => {
  const response = await fetch("/api/generate-pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to generate PDF");
  }

  return await response.blob();
};

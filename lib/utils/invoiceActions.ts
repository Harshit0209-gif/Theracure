import { InvoicePayload } from "@/types/invoice";
import { saveInvoice, printInvoice } from "@/lib/api/invoice";

export const handleSaveInvoice = async ({
  invoicePayload,
  toast,
  closeDialog,
}: {
  invoicePayload: InvoicePayload;
  toast: (args: any) => void;
  closeDialog: () => void;
}) => {
  const result = await saveInvoice(invoicePayload);
  if (result.success) {
    toast({ title: "Invoice Created", description: "Successfully created." });
    closeDialog();
  } else {
    toast({
      title: "Error",
      description: result.error,
      variant: "destructive",
    });
  }
};

export const handlePrintInvoice = async ({
  invoicePayload,
  toast,
}: {
  invoicePayload: InvoicePayload;
  toast: (args: any) => void;
}) => {
  const { invoiceDetails, patientInfo } = invoicePayload;

  if (!patientInfo?.id || !invoiceDetails?.invoiceItems || invoiceDetails.invoiceItems.length === 0) {
    toast({
      title: "Cannot Print",
      description:
        "Patient info or invoice items are missing. Cannot generate invoice.",
      variant: "destructive",
    });
    return;
  }

  try {
    const blob = await printInvoice(invoicePayload);
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => window.URL.revokeObjectURL(url), 2000);
  } catch (error) {
    console.error("Print error:", error);
    toast({
      title: "Print Error",
      description:
        (error instanceof Error ? error.message : String(error)) ||
        "Failed to generate PDF",
      variant: "destructive",
    });
  }
};

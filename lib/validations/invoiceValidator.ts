import {
  PatientInfo,
  Service,
  PaymentDetails,
  InvoiceDetails,
} from "@/types/invoice";

export const validateInvoice = ({
  patientInfo,
  selectedServices,
  paymentDetails,
  invoiceDetails,
  user,
  toast,
}: {
  patientInfo: PatientInfo;
  selectedServices: Service[];
  paymentDetails: PaymentDetails;
  invoiceDetails: InvoiceDetails;
  user: any;
  toast: (args: any) => void;
}): boolean => {
  if (!patientInfo.id || selectedServices.length === 0) {
    toast({
      title: "Validation Error",
      description: "Please enter patient ID and select at least one service.",
      variant: "destructive",
    });
    return false;
  }
  if (paymentDetails.amountPaid < 0) {
    toast({
      title: "Invalid Amount Paid",
      description: "Amount paid cannot be negative.",
      variant: "destructive",
    });
    return false;
  }
  if (paymentDetails.offer < 0 || paymentDetails.offer > 100) {
    toast({
      title: "Invalid Offer Percentage",
      description: "Offer percentage must be between 0 and 100.",
      variant: "destructive",
    });
    return false;
  }
  if (new Date(invoiceDetails.date) > new Date()) {
    toast({
      title: "Invalid Invoice Date",
      description: "Invoice date cannot be in the future.",
      variant: "destructive",
    });
    return false;
  }
  if (!user) {
    toast({
      title: "Authentication Error",
      description: "You must be logged in to create an invoice.",
      variant: "destructive",
    });
    return false;
  }
  return true;
};

import { PaymentDetails, Invoice } from "@/types/invoice";
import { Service } from "@/types/service";
import { Patient } from "@/types/patient";

export const validateInvoice = ({
  patientInfo,
  selectedServices,
  paymentDetails,
  invoiceDetails,
  user,
  toast,
}: {
  patientInfo: Patient;
  selectedServices: Service[];
  paymentDetails: PaymentDetails;
  invoiceDetails: Invoice;
  user: any;
  toast: (args: any) => void;
}): boolean => {
  if (!patientInfo.id) {
    toast({
      title: "Validation Error",
      description: "Please enter a patient ID.",
      variant: "destructive",
    });
    return false;
  }

  if (!patientInfo.patientName || patientInfo.patientName.trim() === "") {
    toast({
      title: "Validation Error",
      description: "Patient not found. Please enter a valid patient ID.",
      variant: "destructive",
    });
    return false;
  }

  if (selectedServices.length === 0) {
    toast({
      title: "Validation Error",
      description: "Please select at least one service.",
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

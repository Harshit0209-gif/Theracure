import { format } from "date-fns";
import { enqueueSMS } from "@/lib/mail/enqueueSMS";
import { TemplateKey } from "./smsTemplatesMap";

interface SMSData {
  phone: string;
  patientName: string;
  therapistName: string;
  serviceName?: string;
  date?: Date;
  startTime?: Date;
  endTime?: Date;
  amount?: number;
  link?: string;
}

export const SMS_CONFIG = {
  APPOINTMENT_CONFIRMATION: (data: SMSData) => ({
    type: "APPOINTMENT_CONFIRMATION" as TemplateKey,
    phone: data.phone,
    variables: {
      var1: data.patientName,
      var2: data.therapistName,
      var3: data.serviceName || "Therapy",
      var4: `${format(data.date!, "do MMM yyyy")} at ${format(
        data.startTime!,
        "hh:mm a"
      )} to ${format(data.endTime!, "hh:mm a")}`,
    },
  }),

  APPOINTMENT_CANCELLED: (data: SMSData) => ({
    type: "APPOINTMENT_CANCELLED" as TemplateKey,
    phone: data.phone,
    variables: {
      var1: data.patientName,
      var2: data.therapistName,
      var3: format(data.date!, "do MMM yyyy"),
    },
  }),

  APPOINTMENT_RESCHEDULED: (data: SMSData) => ({
    type: "APPOINTMENT_RESCHEDULED" as TemplateKey,
    phone: data.phone,
    variables: {
      var1: data.patientName,
      var2: data.therapistName,
      var3: format(data.date!, "do MMM yyyy"),
      var4: format(data.startTime!, "hh:mm a"),
    },
  }),

  INVOICE_NOTIFICATION: (data: SMSData) => ({
    type: "INVOICE_NOTIFICATION" as TemplateKey,
    phone: data.phone,
    variables: {
      var1: data.patientName,
      var2: String(data.amount || 0),
      var3: data.link || "",
    },
  }),

  FEEDBACK_REQUEST: (data: SMSData) => ({
    type: "FEEDBACK_REQUEST" as TemplateKey,
    phone: data.phone,
    variables: {
      var1: data.patientName,
      var2: data.link || "",
    },
  }),
};

export async function sendSMSNotification(
  type: keyof typeof SMS_CONFIG,
  data: SMSData
) {
  if (!data.phone) {
    console.warn("No phone number provided for SMS");
    return;
  }

  try {
    const smsData = SMS_CONFIG[type](data);
    console.log(`Queuing SMS (${type}):`, smsData);
    await enqueueSMS(smsData);
  } catch (error) {
    console.error(`Failed to queue SMS (${type}):`, error);
    throw error;
  }
}

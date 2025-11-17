import { prisma } from "@/lib/prisma";
import { TemplateKey } from "@/config/smsTemplatesMap";
import { SmsStatus } from "../generated/smsEnums";

interface EnqueueSMSParams {
  type: TemplateKey;
  phone: string;
  variables: Record<string, string>;
}

function formatPhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error("Phone number is required");
  }

  let cleaned = phone.replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  }

  if (!cleaned.startsWith("91")) {
    cleaned = "91" + cleaned;
  }

  if (cleaned.length !== 12 || !/^\d+$/.test(cleaned)) {
    throw new Error(
      `Invalid phone number format: ${phone}. Expected format: 919XXXXXXXXX (10 digits after country code)`
    );
  }

  return cleaned;
}

export async function enqueueSMS({ type, phone, variables }: EnqueueSMSParams) {
  const formattedPhone = formatPhoneNumber(phone);

  console.log(`📥 Enqueueing SMS: ${type} to ${formattedPhone}`);

  return await prisma.smsQueue.create({
    data: {
      type,
      phone: formattedPhone,
      variables: JSON.stringify(variables),
      status: SmsStatus.PENDING,
    },
  });
}

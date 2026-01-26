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

  // Split by common delimiters and find the first valid number
  const potentialNumbers = phone.split(/[\s\/\,;]+/);

  for (const potentialNumber of potentialNumbers) {
    let cleaned = potentialNumber.replace(/[\s\-\(\)]/g, "");

    // Remove country code if present
    if (cleaned.startsWith("+91")) {
      cleaned = cleaned.substring(3);
    } else if (cleaned.startsWith("91") && cleaned.length > 10) {
      cleaned = cleaned.substring(2);
    }

    // After stripping country codes, we should have a 10-digit number
    if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
      return "91" + cleaned;
    }
  }

  throw new Error(
    `No valid 10-digit phone number found in: ${phone}. Expected format: 91XXXXXXXXXX`
  );
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

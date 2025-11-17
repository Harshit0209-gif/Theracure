import { prisma } from "@/lib/prisma";
import { sendSMSFlow } from "@/lib/mail/sendSMS";
import { getTemplateId, TemplateKey } from "@/config/smsTemplatesMap";
import { SmsStatus } from "@/lib/generated/smsEnums";

function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith("91")) cleaned = "91" + cleaned;
  if (cleaned.length !== 12) throw new Error(`Invalid phone number: ${phone}`);
  return cleaned;
}

async function processQueue(): Promise<void> {
  const timestamp = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
  });
  console.log(`\n🔄 [${timestamp}] SMS Worker running...`);

  const jobs = await prisma.smsQueue.findMany({
    where: { status: SmsStatus.PENDING },
    take: 5,
  });

  console.log(`📊 Found ${jobs.length} pending job(s)`);

  if (!jobs.length) return;

  let successCount = 0;
  let failureCount = 0;

  for (const job of jobs) {
    try {
      console.log(`\n📤 Processing Job: ${job.id}`);

      const formattedPhone = formatPhoneNumber(job.phone);

      await prisma.smsQueue.update({
        where: { id: job.id },
        data: { status: SmsStatus.PROCESSING },
      });

      const templateId = getTemplateId(job.type as TemplateKey);
      if (!templateId)
        throw new Error(`Missing template for type: ${job.type}`);

      const variables =
        typeof job.variables === "string"
          ? JSON.parse(job.variables)
          : job.variables;

      const response = await sendSMSFlow({
        templateId,
        mobiles: formattedPhone,
        variables: variables as Record<string, string>,
      });

      if (response.type === "success" || response.message === "success") {
        await prisma.smsQueue.update({
          where: { id: job.id },
          data: { status: SmsStatus.SENT },
        });
        console.log(`✅ Sent ${job.id}`);
        successCount++;
      } else {
        throw new Error(response.message || JSON.stringify(response));
      }
    } catch (err: any) {
      const errorMessage = err?.message || "Unknown error";
      const newAttempts = job.attempts + 1;
      const failed = newAttempts >= 3;

      await prisma.smsQueue.update({
        where: { id: job.id },
        data: {
          status: failed ? SmsStatus.FAILED : SmsStatus.PENDING,
          attempts: newAttempts,
          error: errorMessage.slice(0, 500),
        },
      });

      if (failed) {
        console.log(`🚫 Failed permanently: ${job.id}`);
        failureCount++;
      } else {
        console.log(`🔁 Retry ${newAttempts}/3 for ${job.id}`);
      }
    }
  }

  console.log(`\n📈 Summary: ${successCount} sent | ${failureCount} failed`);
}

setInterval(processQueue, 5000);

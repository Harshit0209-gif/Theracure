-- AlterEnum
ALTER TYPE "SmsStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';

-- AlterTable
ALTER TABLE "sms_queue" ADD COLUMN "requestId" TEXT,
ADD COLUMN "deliveryDesc" TEXT,
ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "sms_queue_requestId_idx" ON "sms_queue"("requestId");

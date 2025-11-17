-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "sms_queue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "variables" JSONB NOT NULL,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_queue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sms_queue_id_idx" ON "sms_queue"("id");

-- CreateIndex
CREATE INDEX "sms_queue_phone_idx" ON "sms_queue"("phone");

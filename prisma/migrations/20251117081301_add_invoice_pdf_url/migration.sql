-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "pdf_url" TEXT;

-- AlterTable
ALTER TABLE "sms_queue" ALTER COLUMN "variables" DROP NOT NULL;

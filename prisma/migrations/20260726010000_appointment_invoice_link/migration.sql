-- Module 3: Appointment -> Invoice automation.
--
-- Adds a DRAFT invoice status, a 1:1 optional link from Invoice to the
-- Appointment it was auto-created for, and a small generic audit log table.
--
-- Rollback note (not executed automatically): to revert, drop the
-- appointment_id column/constraint/index on invoices, drop the audit_logs
-- table. The DRAFT enum value cannot be cleanly removed from InvoiceStatus
-- once added (Postgres does not support dropping enum values); reverting
-- would require recreating the enum type without it.

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE IF NOT EXISTS 'DRAFT';

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN "appointment_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_appointment_id_key" ON "invoices"("appointment_id");

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

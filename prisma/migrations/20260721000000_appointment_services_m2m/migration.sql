-- Module 2: Appointment now supports multiple services via a join table.
--
-- Rollback note (not executed automatically): to revert, re-add
-- appointments.service_id, backfill it by picking one service_id per
-- appointment_id from appointment_services (e.g. MIN(service_id) grouped
-- by appointment_id), then drop the appointment_services table.

-- Ensure gen_random_uuid() is available (native in PG13+, no-op otherwise)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "appointment_services" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointment_services_pkey" PRIMARY KEY ("id")
);

-- Backfill: one join row per existing appointment's current service
INSERT INTO "appointment_services" ("id", "appointment_id", "service_id", "created_at")
SELECT gen_random_uuid()::text, "appointment_id", "service_id", now()
FROM "appointments"
WHERE "service_id" IS NOT NULL;

-- Drop the old single-service column (and its FK) now that data is preserved
ALTER TABLE "appointments" DROP COLUMN "service_id";

-- CreateIndex
CREATE UNIQUE INDEX "appointment_services_appointment_id_service_id_key" ON "appointment_services"("appointment_id", "service_id");

-- CreateIndex
CREATE INDEX "appointment_services_service_id_idx" ON "appointment_services"("service_id");

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_services" ADD CONSTRAINT "appointment_services_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

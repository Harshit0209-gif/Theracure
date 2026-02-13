-- Migration: Set NULL on patient delete
-- Safe migration - no data will be deleted

BEGIN;

-- 1. APPOINTMENTS: Make patient_id nullable and change constraint to SET NULL
ALTER TABLE "appointments" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_patient_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 2. PRESCRIPTIONS: Make patient_id nullable and change constraint to SET NULL
ALTER TABLE "prescriptions" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "prescriptions" DROP CONSTRAINT IF EXISTS "prescriptions_patient_id_fkey";
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 3. THERAPY_SESSIONS: Make patient_id nullable and change constraint to SET NULL
ALTER TABLE "therapy_sessions" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "therapy_sessions" DROP CONSTRAINT IF EXISTS "therapy_sessions_patient_id_fkey";
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 4. INVOICES: Make patient_id nullable and change constraint to SET NULL
ALTER TABLE "invoices" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_patient_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
    ON UPDATE CASCADE ON DELETE SET NULL;

-- 5. MEDICAL_RECORDS: Make patient_id nullable and change constraint to SET NULL
ALTER TABLE "medical_records" ALTER COLUMN "patient_id" DROP NOT NULL;
ALTER TABLE "medical_records" DROP CONSTRAINT IF EXISTS "medical_records_patient_id_fkey";
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey"
    FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id")
    ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;

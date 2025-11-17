-- AlterTable - Use generate_patient_id() instead of auto_generate_patient_id() (which is a trigger function)
ALTER TABLE "patients" ALTER COLUMN "patient_id" SET DEFAULT generate_patient_id();

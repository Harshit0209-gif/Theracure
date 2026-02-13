-- CreateFunction: generate_patient_id
-- This function generates sequential patient IDs in format THRCXXX
CREATE OR REPLACE FUNCTION generate_patient_id()
RETURNS TEXT AS $$
DECLARE
    last_num INTEGER;
    next_num INTEGER;
    new_id TEXT;
BEGIN
    -- Lock table to avoid race condition
    LOCK TABLE patients IN EXCLUSIVE MODE;

    -- Only look at patient IDs that match the THRCXXX format
    -- Ignore old formats like "RC477" to avoid parsing errors
    SELECT
        COALESCE(
            MAX(
                CAST(
                    SUBSTRING(patient_id FROM '^THRC(\d+)$')
                    AS INTEGER
                )
            ),
            0
        )
    INTO last_num
    FROM patients
    WHERE patient_id ~ '^THRC\d+$';  -- Only match THRCXXX format

    next_num := last_num + 1;

    new_id := 'THRC' || LPAD(next_num::text, 3, '0');

    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'THERAPIST', 'RECEPTIONIST', 'CONTENT_MANAGER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DUE', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('NOT_ASSIGN', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RecurringEndType" AS ENUM ('COUNT', 'DATE');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MANUAL_THERAPY', 'CONSULTATION', 'ELECTROTHERAPY', 'EXERCISE_THERAPY', 'COMBO_TREATMENT');

-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PRESCRIPTION', 'DIAGNOSTIC', 'NOTES', 'THERAPY_SUMMARY', 'LAB_REPORT', 'XRAY', 'MRI', 'CT_SCAN', 'ULTRASOUND', 'OTHER');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SmsStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CubicleStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "phone" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "patients" (
    "patient_id" VARCHAR(20) NOT NULL DEFAULT generate_patient_id(),
    "patient_name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "gender" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "reference_doctor" TEXT,
    "created_by" TEXT NOT NULL,
    "medicalHistory" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "patients_pkey" PRIMARY KEY ("patient_id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "category" "ServiceCategory" NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapists" (
    "therapist_id" TEXT NOT NULL,
    "specialization" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "qualification" TEXT,
    "experiences" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "therapists_pkey" PRIMARY KEY ("therapist_id")
);

-- CreateTable
CREATE TABLE "therapist_time_slots" (
    "slot_id" TEXT NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_recurring" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapist_time_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "appointment_id" TEXT NOT NULL,
    "patient_id" VARCHAR(20),
    "therapist_id" TEXT NOT NULL,
    "appointment_start_time" TIMESTAMP(3) NOT NULL,
    "appointment_end_time" TIMESTAMP(3) NOT NULL,
    "service_id" TEXT NOT NULL,
    "cubicle_id" TEXT,
    "assigned_date" DATE NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurring_type" "RecurringType",
    "recurring_end_type" "RecurringEndType",
    "recurring_count" INTEGER,
    "recurring_end_date" DATE,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "prescriptions" (
    "prescription_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "patient_id" VARCHAR(20),
    "therapist_id" TEXT NOT NULL,
    "pdf_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prescriptions_pkey" PRIMARY KEY ("prescription_id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "invoice_id" TEXT NOT NULL,
    "patient_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sub_total" DOUBLE PRECISION NOT NULL,
    "total_amount" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DUE',
    "payment_method" TEXT,
    "notes" TEXT,
    "offer" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,
    "pdf_url" TEXT,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("invoice_id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransactionStatus" NOT NULL DEFAULT 'SUCCESS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "priceAtPurchase" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "description" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "therapy_sessions" (
    "session_id" TEXT NOT NULL,
    "patient_id" VARCHAR(20),
    "therapist_id" TEXT NOT NULL,
    "session_notes" TEXT,
    "session_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_data" JSONB,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "therapy_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "consultations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "mobile_number" TEXT NOT NULL,
    "consultation_date" TIMESTAMP(3) NOT NULL,
    "consultation_time" TEXT NOT NULL,
    "note" TEXT,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'NOT_ASSIGN',
    "consulation_with" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "consultations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_records" (
    "id" UUID NOT NULL,
    "patient_id" TEXT,
    "document_type" "document_type" NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT,
    "file_size" INTEGER NOT NULL,
    "uploaded_by" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "category" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "file_path" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sms_queue" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "variables" JSONB,
    "status" "SmsStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sms_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cubicles" (
    "cubicle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "room_number" TEXT,
    "location" TEXT,
    "status" "CubicleStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT NOT NULL,

    CONSTRAINT "cubicles_pkey" PRIMARY KEY ("cubicle_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "therapist_time_slots_therapist_id_week_day_idx" ON "therapist_time_slots"("therapist_id", "week_day");

-- CreateIndex
CREATE INDEX "appointments_therapist_id_appointment_start_time_idx" ON "appointments"("therapist_id", "appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_patient_id_appointment_start_time_idx" ON "appointments"("patient_id", "appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_appointment_start_time_idx" ON "appointments"("appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_cubicle_id_appointment_start_time_idx" ON "appointments"("cubicle_id", "appointment_start_time");

-- CreateIndex
CREATE INDEX "prescriptions_session_id_idx" ON "prescriptions"("session_id");

-- CreateIndex
CREATE INDEX "prescriptions_patient_id_idx" ON "prescriptions"("patient_id");

-- CreateIndex
CREATE INDEX "prescriptions_therapist_id_idx" ON "prescriptions"("therapist_id");

-- CreateIndex
CREATE INDEX "invoices_patient_id_idx" ON "invoices"("patient_id");

-- CreateIndex
CREATE INDEX "invoices_invoice_id_idx" ON "invoices"("invoice_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_date_idx" ON "invoices"("date");

-- CreateIndex
CREATE INDEX "transactions_invoice_id_idx" ON "transactions"("invoice_id");

-- CreateIndex
CREATE INDEX "transactions_transaction_date_idx" ON "transactions"("transaction_date");

-- CreateIndex
CREATE INDEX "therapy_sessions_session_date_idx" ON "therapy_sessions"("session_date");

-- CreateIndex
CREATE INDEX "therapy_sessions_patient_id_idx" ON "therapy_sessions"("patient_id");

-- CreateIndex
CREATE INDEX "therapy_sessions_therapist_id_idx" ON "therapy_sessions"("therapist_id");

-- CreateIndex
CREATE INDEX "consultations_id_idx" ON "consultations"("id");

-- CreateIndex
CREATE INDEX "consultations_consultation_date_idx" ON "consultations"("consultation_date");

-- CreateIndex
CREATE INDEX "consultations_status_idx" ON "consultations"("status");

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_document_type_idx" ON "medical_records"("document_type");

-- CreateIndex
CREATE INDEX "medical_records_upload_date_idx" ON "medical_records"("upload_date");

-- CreateIndex
CREATE INDEX "medical_records_uploaded_by_idx" ON "medical_records"("uploaded_by");

-- CreateIndex
CREATE INDEX "sms_queue_id_idx" ON "sms_queue"("id");

-- CreateIndex
CREATE INDEX "sms_queue_phone_idx" ON "sms_queue"("phone");

-- CreateIndex
CREATE INDEX "cubicles_status_idx" ON "cubicles"("status");

-- CreateIndex
CREATE INDEX "cubicles_created_at_idx" ON "cubicles"("created_at");

-- AddForeignKey
ALTER TABLE "therapists" ADD CONSTRAINT "therapists_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_time_slots" ADD CONSTRAINT "therapist_time_slots_user_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapist_time_slots" ADD CONSTRAINT "therapist_time_slots_therapist_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("therapist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_therapist_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("therapist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_cubicle_id_fkey" FOREIGN KEY ("cubicle_id") REFERENCES "cubicles"("cubicle_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "therapy_sessions"("session_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("therapist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("invoice_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "therapy_sessions" ADD CONSTRAINT "therapy_sessions_therapist_id_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("therapist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

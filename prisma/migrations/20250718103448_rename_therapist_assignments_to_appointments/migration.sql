/*
  Warnings:

  - You are about to drop the `therapist_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RecurringType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "RecurringEndType" AS ENUM ('COUNT', 'DATE');

-- DropForeignKey
ALTER TABLE "therapist_assignments" DROP CONSTRAINT "therapist_assignments_created_by_fkey";

-- DropForeignKey
ALTER TABLE "therapist_assignments" DROP CONSTRAINT "therapist_assignments_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "therapist_assignments" DROP CONSTRAINT "therapist_assignments_service_id_fkey";

-- DropForeignKey
ALTER TABLE "therapist_assignments" DROP CONSTRAINT "therapist_assignments_therapist_fkey";

-- DropForeignKey
ALTER TABLE "therapist_assignments" DROP CONSTRAINT "therapist_assignments_user_fkey";

-- DropTable
DROP TABLE "therapist_assignments";

-- CreateTable
CREATE TABLE "appointments" (
    "assignment_id" TEXT NOT NULL,
    "patient_id" VARCHAR(20) NOT NULL,
    "therapist_id" TEXT NOT NULL,
    "appointment_start_time" TIMESTAMP(3) NOT NULL,
    "appointment_end_time" TIMESTAMP(3) NOT NULL,
    "service_id" TEXT,
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
    "recurring_group_id" TEXT,
    "is_recurring_parent" BOOLEAN NOT NULL DEFAULT false,
    "recurring_parent_id" TEXT,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateIndex
CREATE INDEX "appointments_therapist_id_appointment_start_time_idx" ON "appointments"("therapist_id", "appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_patient_id_appointment_start_time_idx" ON "appointments"("patient_id", "appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_appointment_start_time_idx" ON "appointments"("appointment_start_time");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_recurring_group_id_idx" ON "appointments"("recurring_group_id");

-- CreateIndex
CREATE INDEX "appointments_is_recurring_recurring_group_id_idx" ON "appointments"("is_recurring", "recurring_group_id");

-- CreateIndex
CREATE INDEX "appointments_recurring_parent_id_idx" ON "appointments"("recurring_parent_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "therapist_assignments_user_fkey" FOREIGN KEY ("therapist_id") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "therapist_assignments_therapist_fkey" FOREIGN KEY ("therapist_id") REFERENCES "therapists"("therapist_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recurring_parent_id_fkey" FOREIGN KEY ("recurring_parent_id") REFERENCES "appointments"("assignment_id") ON DELETE CASCADE ON UPDATE CASCADE;

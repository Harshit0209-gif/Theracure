-- CreateEnum
CREATE TYPE "document_type" AS ENUM ('PRESCRIPTION', 'DIAGNOSTIC', 'NOTES', 'THERAPY_SUMMARY', 'LAB_REPORT', 'XRAY', 'MRI', 'CT_SCAN', 'ULTRASOUND', 'OTHER');

-- CreateTable
CREATE TABLE "medical_records" (
    "id" UUID NOT NULL,
    "patient_id" TEXT NOT NULL,
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

    CONSTRAINT "medical_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medical_records_patient_id_idx" ON "medical_records"("patient_id");

-- CreateIndex
CREATE INDEX "medical_records_document_type_idx" ON "medical_records"("document_type");

-- CreateIndex
CREATE INDEX "medical_records_upload_date_idx" ON "medical_records"("upload_date");

-- CreateIndex
CREATE INDEX "medical_records_uploaded_by_idx" ON "medical_records"("uploaded_by");

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("patient_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_records" ADD CONSTRAINT "medical_records_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

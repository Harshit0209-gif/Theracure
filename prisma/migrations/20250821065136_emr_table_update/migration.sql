/*
  Warnings:

  - Added the required column `file_path` to the `medical_records` table without a default value. This is not possible if the table is not empty.
  - Added the required column `original_file_name` to the `medical_records` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "medical_records" ADD COLUMN     "file_path" TEXT NOT NULL,
ADD COLUMN     "original_file_name" TEXT NOT NULL;

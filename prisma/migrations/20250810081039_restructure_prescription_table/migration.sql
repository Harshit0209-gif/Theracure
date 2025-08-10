/*
  Warnings:

  - You are about to drop the column `exercises` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the column `follow_up_date` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the column `medications` on the `prescriptions` table. All the data in the column will be lost.
  - You are about to drop the column `restrictions` on the `prescriptions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "prescriptions" DROP COLUMN "exercises",
DROP COLUMN "follow_up_date",
DROP COLUMN "medications",
DROP COLUMN "restrictions",
ADD COLUMN     "assessment_data" JSONB;

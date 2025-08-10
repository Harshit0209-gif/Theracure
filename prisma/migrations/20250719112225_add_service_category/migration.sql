/*
  Warnings:

  - The primary key for the `appointments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `assignment_id` on the `appointments` table. All the data in the column will be lost.
  - The required column `appointment_id` was added to the `appointments` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `service_id` on table `appointments` required. This step will fail if there are existing NULL values in that column.
  - Changed the type of `category` on the `services` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MANUAL_THERAPY', 'CONSULTATION', 'ELECTROTHERAPY', 'EXERCISE_THERAPY', 'COMBO_TREATMENT');

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_recurring_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_service_id_fkey";

-- AlterTable
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_pkey",
DROP COLUMN "assignment_id",
ADD COLUMN     "appointment_id" TEXT NOT NULL,
ALTER COLUMN "service_id" SET NOT NULL,
ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("appointment_id");

-- AlterTable
ALTER TABLE "services" DROP COLUMN "category",
ADD COLUMN     "category" "ServiceCategory" NOT NULL;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "services"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_recurring_parent_id_fkey" FOREIGN KEY ("recurring_parent_id") REFERENCES "appointments"("appointment_id") ON DELETE CASCADE ON UPDATE CASCADE;

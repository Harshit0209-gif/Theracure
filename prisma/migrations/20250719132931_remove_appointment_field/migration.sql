/*
  Warnings:

  - You are about to drop the column `is_recurring_parent` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `recurring_group_id` on the `appointments` table. All the data in the column will be lost.
  - You are about to drop the column `recurring_parent_id` on the `appointments` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "appointments" DROP CONSTRAINT "appointments_recurring_parent_id_fkey";

-- DropIndex
DROP INDEX "appointments_is_recurring_recurring_group_id_idx";

-- DropIndex
DROP INDEX "appointments_recurring_group_id_idx";

-- DropIndex
DROP INDEX "appointments_recurring_parent_id_idx";

-- AlterTable
ALTER TABLE "appointments" DROP COLUMN "is_recurring_parent",
DROP COLUMN "recurring_group_id",
DROP COLUMN "recurring_parent_id";

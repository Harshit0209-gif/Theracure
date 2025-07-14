/*
  Warnings:

  - The values [confirmed,completed,cancelled,rescheduled] on the enum `AppointmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [confirmed,cancelled,completed,no_show] on the enum `AssignmentStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [scheduled,in_progress,completed,cancelled,no_show] on the enum `SessionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [active,inactive,suspended] on the enum `UserStatus` will be removed. If these variants are still used in the database, this will fail.
  - The `status` column on the `therapists` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppointmentStatus_new" AS ENUM ('CONFIRMED', 'RESCHEDULED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "therapist_assignments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "therapist_assignments" ALTER COLUMN "status" TYPE "AppointmentStatus_new" USING ("status"::text::"AppointmentStatus_new");
ALTER TYPE "AppointmentStatus" RENAME TO "AppointmentStatus_old";
ALTER TYPE "AppointmentStatus_new" RENAME TO "AppointmentStatus";
DROP TYPE "AppointmentStatus_old";
ALTER TABLE "therapist_assignments" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AssignmentStatus_new" AS ENUM ('CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
ALTER TYPE "AssignmentStatus" RENAME TO "AssignmentStatus_old";
ALTER TYPE "AssignmentStatus_new" RENAME TO "AssignmentStatus";
DROP TYPE "AssignmentStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "SessionStatus_new" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
ALTER TYPE "SessionStatus" RENAME TO "SessionStatus_old";
ALTER TYPE "SessionStatus_new" RENAME TO "SessionStatus";
DROP TYPE "SessionStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "UserStatus_new" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
ALTER TABLE "patients" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TABLE "patients" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TABLE "therapists" ALTER COLUMN "status" TYPE "UserStatus_new" USING ("status"::text::"UserStatus_new");
ALTER TYPE "UserStatus" RENAME TO "UserStatus_old";
ALTER TYPE "UserStatus_new" RENAME TO "UserStatus";
DROP TYPE "UserStatus_old";
ALTER TABLE "patients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- AlterTable
ALTER TABLE "patients" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "therapist_assignments" ALTER COLUMN "status" SET DEFAULT 'CONFIRMED';

-- AlterTable
ALTER TABLE "therapists" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "therapists" ALTER COLUMN "status" TYPE "UserStatus" USING ("status"::text::"UserStatus");
ALTER TABLE "therapists" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';


-- AlterTable
ALTER TABLE "users" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

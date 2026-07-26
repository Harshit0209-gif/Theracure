-- Module 6: Holiday Management.
--
-- Extends the existing "holidays" table with activate/deactivate + attribution,
-- and adds a new weekly-off configuration table replacing the previously
-- hardcoded "Sunday is always closed" rule.
--
-- IMPORTANT: Sunday is seeded as the initial active weekly-off day so that
-- behavior is unchanged the moment this migration runs -- today every Sunday
-- is unconditionally blocked in code; this preserves that exact behavior
-- until an admin explicitly changes it via the new UI.
--
-- Rollback note (not executed automatically): drop is_active/created_by
-- columns from holidays, drop the weekly_off_configurations table.

-- AlterTable
ALTER TABLE "holidays" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "holidays" ADD COLUMN "created_by" TEXT;

-- CreateTable
CREATE TABLE "weekly_off_configurations" (
    "id" TEXT NOT NULL,
    "week_day" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_off_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weekly_off_configurations_week_day_key" ON "weekly_off_configurations"("week_day");

-- Ensure gen_random_uuid() is available (native in PG13+, no-op otherwise)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Preserve current behavior: Sunday (0) is unconditionally closed today
INSERT INTO "weekly_off_configurations" ("id", "week_day", "is_active", "created_at", "updated_at")
VALUES (gen_random_uuid()::text, 0, true, now(), now());

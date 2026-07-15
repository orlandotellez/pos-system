-- Migration: Create stores feature (multi-tenant support)
-- Adds stores table, links users and settings to a store

-- CreateTable: stores
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes for stores
CREATE UNIQUE INDEX "stores_name_key" ON "stores"("name");
CREATE INDEX "stores_name_idx" ON "stores"("name");

-- AlterTable: users — add store_id (nullable for backward compatibility with seed)
ALTER TABLE "users" ADD COLUMN "store_id" UUID;

-- Multi-tenant: same email can exist in different stores, NOT twice in the same store
-- Drop the old global unique email constraint
DROP INDEX IF EXISTS "users_email_key";
-- New composite unique constraint (store_id, email)
-- NULL store_ids (existing seed) are treated as distinct by Postgres unique indexes
CREATE UNIQUE INDEX "users_store_id_email_key" ON "users"("store_id", "email");
CREATE INDEX "users_store_id_idx" ON "users"("store_id");

-- AlterTable: settings — make it per-store
-- Remove the auto-increment id in favor of store_id as the unique identifier
-- (or keep id SERIAL but add store_id as unique FK)
ALTER TABLE "settings" ADD COLUMN "store_id" UUID;

-- Add printer settings columns (matching Prisma schema)
ALTER TABLE "settings" ADD COLUMN "printer_name" TEXT;
ALTER TABLE "settings" ADD COLUMN "printer_interface" TEXT;
ALTER TABLE "settings" ADD COLUMN "printer_ip" TEXT;
ALTER TABLE "settings" ADD COLUMN "printer_port" INTEGER;
ALTER TABLE "settings" ADD COLUMN "paper_size" TEXT;
ALTER TABLE "settings" ADD COLUMN "printer_cut_after" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "settings" ADD COLUMN "printer_open_drawer" BOOLEAN NOT NULL DEFAULT false;

-- Unique constraint: one settings per store
CREATE UNIQUE INDEX "settings_store_id_key" ON "settings"("store_id");
CREATE INDEX "settings_store_id_idx" ON "settings"("store_id");

-- AddForeignKeys
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settings" ADD CONSTRAINT "settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

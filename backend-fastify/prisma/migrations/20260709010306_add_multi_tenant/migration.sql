/*
  Warnings:

  - A unique constraint covering the columns `[store_id,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id]` on the table `settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[store_id,email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `store_id` to the `categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `inventory_batches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `inventory_movements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `products` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `services` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `settings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `suppliers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `store_id` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "users_email_key";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory_batches" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "store_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "store_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stores_name_idx" ON "stores"("name");

-- CreateIndex
CREATE INDEX "categories_store_id_idx" ON "categories"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_store_id_name_key" ON "categories"("store_id", "name");

-- CreateIndex
CREATE INDEX "inventory_batches_store_id_idx" ON "inventory_batches"("store_id");

-- CreateIndex
CREATE INDEX "inventory_movements_store_id_idx" ON "inventory_movements"("store_id");

-- CreateIndex
CREATE INDEX "products_store_id_idx" ON "products"("store_id");

-- CreateIndex
CREATE INDEX "sales_store_id_idx" ON "sales"("store_id");

-- CreateIndex
CREATE INDEX "services_store_id_idx" ON "services"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "settings_store_id_key" ON "settings"("store_id");

-- CreateIndex
CREATE INDEX "settings_store_id_idx" ON "settings"("store_id");

-- CreateIndex
CREATE INDEX "suppliers_store_id_idx" ON "suppliers"("store_id");

-- CreateIndex
CREATE INDEX "users_store_id_idx" ON "users"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_store_id_email_key" ON "users"("store_id", "email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_batches" ADD CONSTRAINT "inventory_batches_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

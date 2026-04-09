-- AlterEnum: Add FRIENDS to Visibility
ALTER TYPE "Visibility" ADD VALUE 'FRIENDS';

-- CreateEnum: ProductCategory
CREATE TYPE "ProductCategory" AS ENUM ('WINE', 'SPIRIT', 'SAKE', 'BEER');

-- CreateTable: products
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ProductCategory" NOT NULL,
    "sub_type" TEXT,
    "producer" TEXT,
    "vintage" INTEGER,
    "region" TEXT,
    "abv" DOUBLE PRECISION,
    "image_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add product_id to notes
ALTER TABLE "notes" ADD COLUMN "product_id" TEXT;

-- CreateIndex: products.category
CREATE INDEX "products_category_idx" ON "products"("category");

-- CreateIndex: products.name
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex: notes.product_id
CREATE INDEX "notes_product_id_idx" ON "notes"("product_id");

-- AddForeignKey: notes.product_id -> products.id
ALTER TABLE "notes" ADD CONSTRAINT "notes_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "BinderCategory" AS ENUM ('RESTAURANT', 'WINE', 'SPIRIT', 'MIXED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('RESTAURANT', 'WINE', 'SPIRIT', 'WINERY_VISIT');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('RESTAURANT', 'WINE', 'SPIRIT', 'CUISINE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firebase_uid" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "binders" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "BinderCategory" NOT NULL,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "cover_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "binders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "binder_id" TEXT NOT NULL,
    "type" "NoteType" NOT NULL,
    "title" TEXT NOT NULL,
    "rating" SMALLINT NOT NULL,
    "free_text" TEXT,
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "tag_ids" TEXT[],
    "extension" JSONB NOT NULL DEFAULT '{}',
    "venue_id" TEXT,
    "experienced_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "note_id" TEXT,
    "uploader_id" TEXT NOT NULL,
    "r2_key" TEXT NOT NULL,
    "public_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "phone" TEXT,
    "website" TEXT,
    "google_rating" DOUBLE PRECISION,
    "price_level" INTEGER,
    "types" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours" JSONB,
    "last_fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_taxonomy" (
    "id" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL,
    "name" TEXT NOT NULL,
    "group" TEXT NOT NULL,
    "emoji" TEXT,

    CONSTRAINT "tag_taxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebase_uid_key" ON "users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "binders_owner_id_idx" ON "binders"("owner_id");

-- CreateIndex
CREATE INDEX "notes_author_id_created_at_idx" ON "notes"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notes_binder_id_idx" ON "notes"("binder_id");

-- CreateIndex
CREATE INDEX "notes_venue_id_idx" ON "notes"("venue_id");

-- CreateIndex
CREATE INDEX "notes_type_idx" ON "notes"("type");

-- CreateIndex
CREATE INDEX "photos_note_id_idx" ON "photos"("note_id");

-- CreateIndex
CREATE INDEX "photos_uploader_id_idx" ON "photos"("uploader_id");

-- CreateIndex
CREATE UNIQUE INDEX "venues_place_id_key" ON "venues"("place_id");

-- CreateIndex
CREATE INDEX "tag_taxonomy_category_idx" ON "tag_taxonomy"("category");

-- CreateIndex
CREATE UNIQUE INDEX "tag_taxonomy_category_name_key" ON "tag_taxonomy"("category", "name");

-- AddForeignKey
ALTER TABLE "binders" ADD CONSTRAINT "binders_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_binder_id_fkey" FOREIGN KEY ("binder_id") REFERENCES "binders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

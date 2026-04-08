-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('BOOKMARKED', 'ECHOED', 'DIVERGED');

-- CreateEnum
CREATE TYPE "TasteCategory" AS ENUM ('RESTAURANT', 'WINE', 'SPIRIT');

-- CreateTable
CREATE TABLE "binder_follows" (
    "id" TEXT NOT NULL,
    "follower_id" TEXT NOT NULL,
    "binder_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "binder_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_signals" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "signal_type" "SignalType" NOT NULL,
    "sender_rating" SMALLINT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taste_signals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_similarities" (
    "id" TEXT NOT NULL,
    "user_a_id" TEXT NOT NULL,
    "user_b_id" TEXT NOT NULL,
    "category" "TasteCategory" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "overlap_count" INTEGER NOT NULL,
    "last_computed_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taste_similarities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gourmet_friend_pins" (
    "id" TEXT NOT NULL,
    "pinner_id" TEXT NOT NULL,
    "pinned_id" TEXT NOT NULL,
    "categories" "TasteCategory"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gourmet_friend_pins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "binder_follows_follower_id_idx" ON "binder_follows"("follower_id");

-- CreateIndex
CREATE INDEX "binder_follows_binder_id_idx" ON "binder_follows"("binder_id");

-- CreateIndex
CREATE UNIQUE INDEX "binder_follows_follower_id_binder_id_key" ON "binder_follows"("follower_id", "binder_id");

-- CreateIndex
CREATE INDEX "taste_signals_note_id_idx" ON "taste_signals"("note_id");

-- CreateIndex
CREATE INDEX "taste_signals_sender_id_idx" ON "taste_signals"("sender_id");

-- CreateIndex
CREATE INDEX "taste_signals_note_id_signal_type_idx" ON "taste_signals"("note_id", "signal_type");

-- CreateIndex
CREATE UNIQUE INDEX "taste_signals_sender_id_note_id_signal_type_key" ON "taste_signals"("sender_id", "note_id", "signal_type");

-- CreateIndex
CREATE INDEX "taste_similarities_user_a_id_score_idx" ON "taste_similarities"("user_a_id", "score" DESC);

-- CreateIndex
CREATE INDEX "taste_similarities_user_b_id_score_idx" ON "taste_similarities"("user_b_id", "score" DESC);

-- CreateIndex
CREATE INDEX "taste_similarities_user_a_id_category_idx" ON "taste_similarities"("user_a_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "taste_similarities_user_a_id_user_b_id_category_key" ON "taste_similarities"("user_a_id", "user_b_id", "category");

-- CreateIndex
CREATE INDEX "gourmet_friend_pins_pinner_id_idx" ON "gourmet_friend_pins"("pinner_id");

-- CreateIndex
CREATE INDEX "gourmet_friend_pins_pinned_id_idx" ON "gourmet_friend_pins"("pinned_id");

-- CreateIndex
CREATE UNIQUE INDEX "gourmet_friend_pins_pinner_id_pinned_id_key" ON "gourmet_friend_pins"("pinner_id", "pinned_id");

-- CreateIndex
CREATE INDEX "notes_visibility_created_at_idx" ON "notes"("visibility", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notes_visibility_type_created_at_idx" ON "notes"("visibility", "type", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "binder_follows" ADD CONSTRAINT "binder_follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "binder_follows" ADD CONSTRAINT "binder_follows_binder_id_fkey" FOREIGN KEY ("binder_id") REFERENCES "binders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_signals" ADD CONSTRAINT "taste_signals_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_signals" ADD CONSTRAINT "taste_signals_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_similarities" ADD CONSTRAINT "taste_similarities_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_similarities" ADD CONSTRAINT "taste_similarities_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gourmet_friend_pins" ADD CONSTRAINT "gourmet_friend_pins_pinner_id_fkey" FOREIGN KEY ("pinner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gourmet_friend_pins" ADD CONSTRAINT "gourmet_friend_pins_pinned_id_fkey" FOREIGN KEY ("pinned_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

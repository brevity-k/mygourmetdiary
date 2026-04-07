-- Rename firebase_uid to supabase_id (idempotent)
ALTER TABLE "users" RENAME COLUMN "firebase_uid" TO "supabase_id";

-- Rename unique index
DROP INDEX IF EXISTS "users_firebase_uid_key";
CREATE UNIQUE INDEX IF NOT EXISTS "users_supabase_id_key" ON "users"("supabase_id");

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "venues_lat_lng_idx" ON "venues"("lat", "lng");
CREATE INDEX IF NOT EXISTS "notes_venue_id_visibility_idx" ON "notes"("venue_id", "visibility");
CREATE INDEX IF NOT EXISTS "notes_author_id_visibility_idx" ON "notes"("author_id", "visibility");

-- Full-text search indexes (replaces Meilisearch)
CREATE INDEX IF NOT EXISTS "notes_title_trgm_idx" ON "notes" USING gin("title" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "notes_free_text_trgm_idx" ON "notes" USING gin("free_text" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "venues_name_trgm_idx" ON "venues" USING gin("name" gin_trgm_ops);

-- AlterTable
ALTER TABLE "Doc" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- Index (optional but helpful for public lookups / filtering)
CREATE INDEX IF NOT EXISTS "Doc_isPublic_idx" ON "Doc"("isPublic");


-- AlterTable
ALTER TABLE "Doc"
  ADD COLUMN IF NOT EXISTS "isPublic" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "shareToken" TEXT;

-- Unique constraint for share token
CREATE UNIQUE INDEX IF NOT EXISTS "Doc_shareToken_key" ON "Doc"("shareToken");

-- Optional indexes
CREATE INDEX IF NOT EXISTS "Doc_isPublic_idx" ON "Doc"("isPublic");

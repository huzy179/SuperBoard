-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Workspace_isArchived_deletedAt_idx" ON "Workspace"("isArchived", "deletedAt");

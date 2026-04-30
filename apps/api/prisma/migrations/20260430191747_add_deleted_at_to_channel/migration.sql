-- DropIndex
DROP INDEX "Channel_workspaceId_idx";

-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Channel_workspaceId_deletedAt_idx" ON "Channel"("workspaceId", "deletedAt");

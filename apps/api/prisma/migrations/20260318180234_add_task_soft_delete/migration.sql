-- DropIndex
DROP INDEX "Task_projectId_status_idx";

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Task_projectId_status_isArchived_idx" ON "Task"("projectId", "status", "isArchived");

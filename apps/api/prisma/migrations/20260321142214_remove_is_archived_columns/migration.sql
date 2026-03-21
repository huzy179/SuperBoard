-- Drop legacy archive flags and use deletedAt as the single archive source of truth
ALTER TABLE "Workspace" DROP COLUMN "isArchived";
ALTER TABLE "Project" DROP COLUMN "isArchived";
ALTER TABLE "Task" DROP COLUMN "isArchived";

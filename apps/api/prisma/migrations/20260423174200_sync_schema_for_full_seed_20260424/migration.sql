/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/

CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TaskLinkType') THEN
        CREATE TYPE "TaskLinkType" AS ENUM ('blocks', 'relates_to', 'duplicates');
    END IF;
END $$;

-- CreateEnum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'IntegrationProvider') THEN
        CREATE TYPE "IntegrationProvider" AS ENUM ('SLACK', 'DISCORD', 'GITHUB', 'GITLAB', 'ZAPIER');
    END IF;
END $$;

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN IF NOT EXISTS "aiContext" TEXT,
ADD COLUMN IF NOT EXISTS "aiMetadata" JSONB;

-- AlterTable
ALTER TABLE "Doc" ADD COLUMN IF NOT EXISTS "projectId" TEXT,
ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "aiSummary" TEXT,
ADD COLUMN IF NOT EXISTS "neuralPriority" TEXT NOT NULL DEFAULT 'AMBIENT';

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN IF NOT EXISTS "commentMentionEmail" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "commentMentionInApp" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "summary" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "aiSkillProfile" JSONB,
ADD COLUMN IF NOT EXISTS "username" TEXT;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProjectMemoir" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMemoir_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskLink" (
    "id" TEXT NOT NULL,
    "sourceTaskId" TEXT NOT NULL,
    "targetTaskId" TEXT NOT NULL,
    "type" "TaskLinkType" NOT NULL DEFAULT 'relates_to',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskEmbedding" (
    "taskId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskEmbedding_pkey" PRIMARY KEY ("taskId")
);

-- CreateTable
CREATE TABLE "ProjectEmbedding" (
    "projectId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEmbedding_pkey" PRIMARY KEY ("projectId")
);

-- CreateTable
CREATE TABLE "TaskDocLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'manual',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDocLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocEmbedding" (
    "docId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocEmbedding_pkey" PRIMARY KEY ("docId")
);

-- CreateTable
CREATE TABLE "WorkflowRule" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trigger" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentAction" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "agentName" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalIntegration" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalLog" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "integrationId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "payload" JSONB NOT NULL,
    "interpretation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SignalLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalEmbedding" (
    "signalId" TEXT NOT NULL,
    "vector" vector(768) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignalEmbedding_pkey" PRIMARY KEY ("signalId")
);

-- CreateIndex
CREATE INDEX "ProjectMemoir_projectId_idx" ON "ProjectMemoir"("projectId");

-- CreateIndex
CREATE INDEX "TaskLink_sourceTaskId_idx" ON "TaskLink"("sourceTaskId");

-- CreateIndex
CREATE INDEX "TaskLink_targetTaskId_idx" ON "TaskLink"("targetTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskLink_sourceTaskId_targetTaskId_type_key" ON "TaskLink"("sourceTaskId", "targetTaskId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDocLink_taskId_docId_key" ON "TaskDocLink"("taskId", "docId");

-- CreateIndex
CREATE INDEX "WorkflowRule_workspaceId_isActive_idx" ON "WorkflowRule"("workspaceId", "isActive");

-- CreateIndex
CREATE INDEX "WorkflowRule_projectId_isActive_idx" ON "WorkflowRule"("projectId", "isActive");

-- CreateIndex
CREATE INDEX "AgentAction_workspaceId_idx" ON "AgentAction"("workspaceId");

-- CreateIndex
CREATE INDEX "AgentAction_projectId_idx" ON "AgentAction"("projectId");

-- CreateIndex
CREATE INDEX "ExternalIntegration_workspaceId_idx" ON "ExternalIntegration"("workspaceId");

-- CreateIndex
CREATE INDEX "ExternalIntegration_projectId_idx" ON "ExternalIntegration"("projectId");

-- CreateIndex
CREATE INDEX "SignalLog_workspaceId_idx" ON "SignalLog"("workspaceId");

-- CreateIndex
CREATE INDEX "SignalLog_projectId_idx" ON "SignalLog"("projectId");

-- CreateIndex
CREATE INDEX "Doc_projectId_idx" ON "Doc"("projectId");

-- CreateIndex
CREATE INDEX "TaskEvent_actorId_createdAt_idx" ON "TaskEvent"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "ProjectMemoir" ADD CONSTRAINT "ProjectMemoir_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskEmbedding" ADD CONSTRAINT "TaskEmbedding_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEmbedding" ADD CONSTRAINT "ProjectEmbedding_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Doc" ADD CONSTRAINT "Doc_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDocLink" ADD CONSTRAINT "TaskDocLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDocLink" ADD CONSTRAINT "TaskDocLink_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocEmbedding" ADD CONSTRAINT "DocEmbedding_docId_fkey" FOREIGN KEY ("docId") REFERENCES "Doc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowRule" ADD CONSTRAINT "WorkflowRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentAction" ADD CONSTRAINT "AgentAction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegration" ADD CONSTRAINT "ExternalIntegration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalIntegration" ADD CONSTRAINT "ExternalIntegration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalLog" ADD CONSTRAINT "SignalLog_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalLog" ADD CONSTRAINT "SignalLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalLog" ADD CONSTRAINT "SignalLog_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignalEmbedding" ADD CONSTRAINT "SignalEmbedding_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "SignalLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

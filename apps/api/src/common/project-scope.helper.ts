import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { findOrThrow } from './helpers';

export async function verifyActiveProjectInWorkspace(
  prisma: PrismaService,
  input: { projectId: string; workspaceId: string },
): Promise<void> {
  await findOrThrow(
    prisma.project.findFirst({
      where: {
        id: input.projectId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      } as Prisma.ProjectWhereInput,
      select: { id: true },
    }),
    'Project',
  );
}

export async function verifyProjectAndTaskInWorkspace(
  prisma: PrismaService,
  input: { projectId: string; taskId: string; workspaceId: string },
): Promise<void> {
  await verifyActiveProjectInWorkspace(prisma, {
    projectId: input.projectId,
    workspaceId: input.workspaceId,
  });

  await findOrThrow(
    prisma.task.findFirst({
      where: {
        id: input.taskId,
        projectId: input.projectId,
        deletedAt: null,
      } as Prisma.TaskWhereInput,
      select: { id: true },
    }),
    'Task',
  );
}

export async function verifyAssigneeInWorkspace(
  prisma: PrismaService,
  input: { workspaceId: string; assigneeId: string },
): Promise<void> {
  const userInWorkspace = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      userId: input.assigneeId,
      deletedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (!userInWorkspace) {
    throw new BadRequestException('Assignee is not a workspace member');
  }
}

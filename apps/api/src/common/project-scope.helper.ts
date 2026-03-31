import { BadRequestException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { findOrThrow } from './helpers';

type ProjectWorkspaceScope = {
  projectId: string;
  workspaceId: string;
};

type ProjectTaskWorkspaceScope = {
  projectId: string;
  taskId: string;
  workspaceId: string;
};

type WorkspaceAssigneeScope = {
  workspaceId: string;
  assigneeId: string;
};

type TaskWorkspaceScope = {
  taskId: string;
  workspaceId: string;
};

export async function verifyActiveProjectInWorkspace(
  prisma: PrismaService,
  input: ProjectWorkspaceScope,
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
  input: ProjectTaskWorkspaceScope,
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
  input: WorkspaceAssigneeScope,
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

export async function verifyActiveTaskInWorkspace(
  prisma: PrismaService,
  input: TaskWorkspaceScope,
): Promise<void> {
  await findOrThrow(
    prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: {
          workspaceId: input.workspaceId,
          deletedAt: null,
          workspace: {
            deletedAt: null,
          },
        },
      } as Prisma.TaskWhereInput,
      select: {
        id: true,
      },
    }),
    'Task',
  );
}

export async function findTaskWithProjectInWorkspaceOrThrow(
  prisma: PrismaService,
  input: TaskWorkspaceScope,
): Promise<{
  project: {
    deletedAt: Date | null;
    workspace: {
      deletedAt: Date | null;
    };
  };
}> {
  const task = await findOrThrow(
    prisma.task.findFirst({
      where: {
        id: input.taskId,
        project: {
          workspaceId: input.workspaceId,
        },
      } as Prisma.TaskWhereInput,
      select: {
        project: {
          select: {
            deletedAt: true,
            workspace: {
              select: {
                deletedAt: true,
              },
            },
          },
        },
      },
    }),
    'Task',
  );

  return task;
}

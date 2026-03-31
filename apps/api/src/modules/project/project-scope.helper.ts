import type { Prisma } from '@prisma/client';
import { findOrThrow } from '../../common/helpers';
import { PrismaService } from '../../prisma/prisma.service';

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

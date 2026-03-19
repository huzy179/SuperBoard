import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { ProjectService } from '../src/modules/project/project.service';
import { TaskService } from '../src/modules/task/task.service';
import { WorkspaceService } from '../src/modules/workspace/workspace.service';

type PrismaMock = Record<string, unknown>;

describe('workflow lifecycle', () => {
  it('archives workspace/project/task with isArchived=true and deletedAt set', async () => {
    const now = new Date();

    let archivedWorkspace: Record<string, unknown> | null = null;
    let archivedProject: Record<string, unknown> | null = null;
    let archivedTask: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findFirst: async () => ({ id: 'workspace-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          archivedWorkspace = data;
          return { id: 'workspace-1' };
        },
      },
      project: {
        findFirst: async () => ({ id: 'project-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          archivedProject = data;
          return { id: 'project-1' };
        },
      },
      task: {
        findFirst: async () => ({ id: 'task-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          archivedTask = data;
          return { id: 'task-1' };
        },
      },
    } satisfies PrismaMock;

    const workspaceService = new WorkspaceService(prisma as never);
    const projectService = new ProjectService(prisma as never);
    const taskService = new TaskService(prisma as never);

    await workspaceService.archiveWorkspaceForUser({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      archivedAt: now,
    });

    await projectService.archiveProjectForWorkspace({
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      archivedAt: now,
    });

    await taskService.archiveTaskForWorkspace({
      taskId: 'task-1',
      workspaceId: 'workspace-1',
      archivedAt: now,
    });

    assert.equal(archivedWorkspace?.isArchived, true);
    assert.equal(archivedProject?.isArchived, true);
    assert.equal(archivedTask?.isArchived, true);

    assert.ok(archivedWorkspace?.deletedAt instanceof Date);
    assert.ok(archivedProject?.deletedAt instanceof Date);
    assert.ok(archivedTask?.deletedAt instanceof Date);
  });

  it('blocks restoring child when parent is archived and returns guidance message', async () => {
    const prisma = {
      task: {
        findFirst: async () => ({
          id: 'task-1',
          project: {
            id: 'project-1',
            isArchived: true,
            deletedAt: new Date(),
            workspace: {
              id: 'workspace-1',
              isArchived: false,
              deletedAt: null,
            },
          },
        }),
      },
    } satisfies PrismaMock;

    const taskService = new TaskService(prisma as never);

    await assert.rejects(
      async () => {
        await taskService.restoreTaskForWorkspace({
          taskId: 'task-1',
          workspaceId: 'workspace-1',
          restoredAt: new Date(),
        });
      },
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /Cannot restore.*restore.*first/i);
        return true;
      },
    );
  });

  it('filters archived records by default and includes archived when showArchived=true', async () => {
    let workspaceWhere: Record<string, unknown> | null = null;
    let projectWhere: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          workspaceWhere = where;
          return [];
        },
      },
      project: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          projectWhere = where;
          return [];
        },
      },
    } satisfies PrismaMock;

    const workspaceService = new WorkspaceService(prisma as never);
    const projectService = new ProjectService(prisma as never);

    await workspaceService.getWorkspacesByUser('user-1');
    await projectService.getProjectsByWorkspace('workspace-1');

    assert.equal(workspaceWhere?.isArchived, false);
    assert.equal(projectWhere?.isArchived, false);

    await workspaceService.getWorkspacesByUser('user-1', { showArchived: true });
    await projectService.getProjectsByWorkspace('workspace-1', { showArchived: true });

    assert.equal(workspaceWhere?.deletedAt, null);
    assert.equal(projectWhere?.deletedAt, null);
    assert.equal(workspaceWhere?.isArchived, undefined);
    assert.equal(projectWhere?.isArchived, undefined);
  });
});

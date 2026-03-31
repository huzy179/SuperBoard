import assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { TaskService } from '../../src/modules/task/task.service';

type PrismaMock = Record<string, unknown>;

describe('TaskService', () => {
  it('archiveTaskForWorkspace sets deletedAt', async () => {
    const archivedAt = new Date();
    let updatedData: Record<string, unknown> | null = null;

    const prisma = {
      task: {
        findFirst: async () => ({ id: 'task-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data;
          return { id: 'task-1' };
        },
      },
    } satisfies PrismaMock;

    const service = new TaskService(prisma as never);

    await service.archiveTaskForWorkspace({
      taskId: 'task-1',
      workspaceId: 'workspace-1',
      archivedAt,
    });

    assert.equal(updatedData?.['deletedAt'], archivedAt);
  });

  it('archiveTaskForWorkspace throws NotFound when task is missing', async () => {
    const prisma = {
      task: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    const service = new TaskService(prisma as never);

    await assert.rejects(
      () =>
        service.archiveTaskForWorkspace({
          taskId: 'task-404',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Task not found/i);
        return true;
      },
    );
  });

  it('restoreTaskForWorkspace blocks when project is deleted', async () => {
    const prisma = {
      task: {
        findFirst: async () => ({
          id: 'task-1',
          project: {
            id: 'project-1',
            deletedAt: new Date(),
            workspace: {
              id: 'workspace-1',
              deletedAt: null,
            },
          },
        }),
      },
    } satisfies PrismaMock;

    const service = new TaskService(prisma as never);

    await assert.rejects(
      () =>
        service.restoreTaskForWorkspace({
          taskId: 'task-1',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /restore project first/i);
        return true;
      },
    );
  });

  it('restoreTaskForWorkspace blocks when workspace is deleted', async () => {
    const prisma = {
      task: {
        findFirst: async () => ({
          id: 'task-1',
          project: {
            id: 'project-1',
            deletedAt: null,
            workspace: {
              id: 'workspace-1',
              deletedAt: new Date(),
            },
          },
        }),
      },
    } satisfies PrismaMock;

    const service = new TaskService(prisma as never);

    await assert.rejects(
      () =>
        service.restoreTaskForWorkspace({
          taskId: 'task-1',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /restore workspace first/i);
        return true;
      },
    );
  });

  it('restoreTaskForWorkspace clears deletedAt when parent tree is active', async () => {
    let updatedData: Record<string, unknown> | null = null;

    const prisma = {
      task: {
        findFirst: async () => ({
          id: 'task-1',
          project: {
            id: 'project-1',
            deletedAt: null,
            workspace: {
              id: 'workspace-1',
              deletedAt: null,
            },
          },
        }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data;
          return { id: 'task-1' };
        },
      },
    } satisfies PrismaMock;

    const service = new TaskService(prisma as never);

    await service.restoreTaskForWorkspace({
      taskId: 'task-1',
      workspaceId: 'workspace-1',
    });

    assert.equal(updatedData?.['deletedAt'], null);
  });
});

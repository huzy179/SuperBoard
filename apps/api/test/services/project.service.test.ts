import assert from 'node:assert/strict';
import { NotFoundException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { ProjectService } from '../../src/modules/project/project.service';

type PrismaMock = Record<string, unknown>;

describe('ProjectService', () => {
  it('createTaskForProject persists provided workflow status key', async () => {
    let createdStatus: string | null = null;
    let createdEventType: string | null = null;

    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
      },
      task: {
        aggregate: async () => ({ _max: { number: 6 } }),
        create: async ({ data }: { data: { status: string } }) => {
          createdStatus = data.status;
          return {
            id: 'task-1',
            title: 'T',
            description: null,
            status: data.status,
            priority: 'medium',
            type: 'task',
            number: 7,
            storyPoints: null,
            position: '7000',
            dueDate: null,
            assigneeId: null,
            assignee: null,
            labels: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
      taskEvent: {
        create: async ({ data }: { data: { type: string } }) => {
          createdEventType = data.type;
          return { id: 'event-1' };
        },
      },
    } satisfies PrismaMock;

    const service = new ProjectService(prisma as never, {} as never);

    const result = await service.createTaskForProject({
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      title: 'Task 1',
      status: 'in_review',
      priority: 'medium',
    });

    assert.equal(createdStatus, 'in_review');
    assert.equal(result.status, 'in_review');
    assert.equal(createdEventType, 'created');
  });

  it('updateTaskStatusForProject throws NotFound when task missing', async () => {
    let updateCalled = false;

    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
      },
      task: {
        findFirst: async () => null,
        update: async () => {
          updateCalled = true;
          return {
            id: 'task-1',
            title: 'T',
            description: null,
            status: 'in_review',
            priority: 'medium',
            dueDate: null,
            assigneeId: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        },
      },
    } satisfies PrismaMock;

    const service = new ProjectService(prisma as never, {} as never);

    await assert.rejects(
      () =>
        service.updateTaskStatusForProject({
          projectId: 'project-1',
          taskId: 'task-1',
          workspaceId: 'workspace-1',
          status: 'in_review',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Task not found/i);
        return true;
      },
    );

    assert.equal(updateCalled, false);
  });

  it('archiveProjectForWorkspace sets deletedAt', async () => {
    const archivedAt = new Date();
    let updatedData: Record<string, unknown> | null = null;

    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data;
          return { id: 'project-1' };
        },
      },
    } satisfies PrismaMock;

    const service = new ProjectService(prisma as never, {} as never);

    await service.archiveProjectForWorkspace({
      projectId: 'project-1',
      workspaceId: 'workspace-1',
      archivedAt,
    });

    assert.equal(updatedData?.['deletedAt'], archivedAt);
  });

  it('getTaskHistoryForProject returns latest history items', async () => {
    const now = new Date();

    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
      },
      task: {
        findFirst: async () => ({ id: 'task-1' }),
      },
      taskEvent: {
        findMany: async () => [
          {
            id: 'event-1',
            type: 'status_changed',
            actorId: 'user-1',
            createdAt: now,
            payload: { from: 'todo', to: 'in_progress' },
            actor: { fullName: 'Nguyễn Văn A' },
          },
        ],
      },
    } satisfies PrismaMock;

    const service = new ProjectService(prisma as never, {} as never);

    const history = await service.getTaskHistoryForProject({
      projectId: 'project-1',
      taskId: 'task-1',
      workspaceId: 'workspace-1',
    });

    assert.equal(history.length, 1);
    assert.equal(history[0]?.type, 'status_changed');
    assert.equal(history[0]?.actorName, 'Nguyễn Văn A');
    assert.equal(history[0]?.payload?.from, 'todo');
    assert.equal(history[0]?.payload?.to, 'in_progress');
  });
});

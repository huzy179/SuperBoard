import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { ProjectService } from '../src/modules/project/project.service';
import { WorkflowService } from '../src/modules/workflow/workflow.service';

type PrismaMock = Record<string, unknown>;

describe('workflow status policy', () => {
  it('project creation clones workspace status template snapshot (no dynamic link)', async () => {
    let cloneCalledWith: { workspaceId: string; projectId: string } | null = null;

    const prisma = {
      project: {
        create: async () => ({
          id: 'project-1',
          name: 'Project 1',
          description: null,
          color: null,
          icon: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      },
      $transaction: async <T>(callback: (tx: PrismaMock) => Promise<T>) =>
        callback(prisma as PrismaMock),
    } satisfies PrismaMock;

    const workflowService = {
      cloneWorkspaceTemplateToProject: async (workspaceId: string, projectId: string) => {
        cloneCalledWith = { workspaceId, projectId };
      },
    } as unknown as WorkflowService;

    const projectService = new ProjectService(prisma as never, workflowService, null as never);

    await projectService.createProject('workspace-1', { name: 'Project 1' });

    assert.deepEqual(cloneCalledWith, {
      workspaceId: 'workspace-1',
      projectId: 'project-1',
    });
  });

  it('update task status outside transition graph returns 400 and keeps current status', async () => {
    let updateCalled = false;

    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
      },
      task: {
        findFirst: async () => ({
          id: 'task-1',
          status: 'todo',
        }),
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

    const workflowService = {} as WorkflowService;
    const taskService = {
      validateTransition: async () => {
        throw new BadRequestException('Invalid transition: todo -> in_review');
      },
    };

    const projectService = new ProjectService(
      prisma as never,
      workflowService,
      taskService as never,
    );

    await assert.rejects(
      () =>
        projectService.updateTaskStatusForProject({
          projectId: 'project-1',
          taskId: 'task-1',
          workspaceId: 'workspace-1',
          status: 'in_review',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /Invalid transition/i);
        return true;
      },
    );

    assert.equal(updateCalled, false);
  });

  it('status delete/rename in-use requires migration of affected tasks first', async () => {
    const prisma = {
      projectWorkflowStatus: {
        findFirst: async () => ({
          id: 'status-1',
          key: 'in_review',
          projectId: 'project-1',
          isSystem: false,
        }),
      },
      task: {
        count: async () => 2,
      },
    } satisfies PrismaMock;

    const workflowService = new WorkflowService(prisma as never);

    await assert.rejects(
      () =>
        workflowService.renameProjectStatus({
          workspaceId: 'workspace-1',
          projectId: 'project-1',
          statusKey: 'in_review',
          newKey: 'qa_review',
          actorUserId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /migrate/i);
        return true;
      },
    );
  });
});

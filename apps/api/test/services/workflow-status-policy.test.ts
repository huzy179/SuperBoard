/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { WorkflowService } from '../../src/modules/workflow/workflow.service';
import { ProjectService } from '../../src/modules/project/project.service';

type PrismaMock = Record<string, any>;

describe('Workflow Status Policy', () => {
  describe('WorkflowService', () => {
    it('validateTransition allows valid transition', async () => {
      const prisma = {
        projectWorkflowStatus: {
          findFirst: async ({ where }: any) => {
            if (where.key === 'todo') return { id: 's1', name: 'Todo' };
            if (where.key === 'in_progress') return { id: 's2', name: 'In Progress' };
            return null;
          },
        },
        projectWorkflowTransition: {
          findFirst: async () => ({ id: 't1' }),
        },
      } satisfies PrismaMock;

      const service = new WorkflowService(prisma as any);
      await assert.doesNotReject(() => service.validateTransition('p1', 'todo', 'in_progress'));
    });

    it('validateTransition throws BadRequest for invalid transition', async () => {
      const prisma = {
        projectWorkflowStatus: {
          findFirst: async ({ where }: any) => {
            if (where.key === 'todo') return { id: 's1', name: 'Todo' };
            if (where.key === 'done') return { id: 's3', name: 'Done' };
            return null;
          },
        },
        projectWorkflowTransition: {
          findFirst: async () => null,
        },
      } satisfies PrismaMock;

      const service = new WorkflowService(prisma as any);
      await assert.rejects(
        () => service.validateTransition('p1', 'todo', 'done'),
        (error: any) => {
          assert.ok(error instanceof BadRequestException);
          assert.match(error.message, /không cho phép chuyển đổi từ "Todo" sang "Done"/);
          return true;
        },
      );
    });
  });

  describe('ProjectService Integration', () => {
    it('createProject triggers template cloning', async () => {
      let cloneCalled = false;
      const prisma = {
        project: {
          create: async () => ({
            id: 'p-new',
            name: 'New Project',
            description: null,
            color: null,
            icon: null,
            key: 'NP',
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        },
      } satisfies PrismaMock;

      const workflowService = {
        cloneWorkspaceTemplateToProject: async () => {
          cloneCalled = true;
        },
      } satisfies Record<string, any>;

      const service = new ProjectService(prisma as any, {} as any, workflowService as any);

      await service.createProject('w1', { name: 'New Project' });
      assert.strictEqual(cloneCalled, true);
    });
  });
});

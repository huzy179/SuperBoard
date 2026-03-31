import assert from 'node:assert/strict';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it } from 'node:test';
import {
  findTaskWithProjectInWorkspaceOrThrow,
  verifyActiveProjectInWorkspace,
  verifyActiveTaskInWorkspace,
  verifyAssigneeInWorkspace,
  verifyProjectAndTaskInWorkspace,
} from '../../src/common/project-scope.helper';
import {
  verifyActiveWorkspaceForUser,
  verifyArchivedWorkspaceForUser,
  verifyWorkspaceAdminOrOwner,
  verifyWorkspaceMembership,
} from '../../src/common/workspace-member.helper';

type PrismaMock = Record<string, unknown>;

describe('project-scope.helper', () => {
  it('verifyActiveProjectInWorkspace throws when project does not exist', async () => {
    const prisma = {
      project: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyActiveProjectInWorkspace(prisma as never, {
          projectId: 'project-1',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Project not found/i);
        return true;
      },
    );
  });

  it('verifyProjectAndTaskInWorkspace throws when task does not exist', async () => {
    const prisma = {
      project: {
        findFirst: async () => ({ id: 'project-1' }),
      },
      task: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyProjectAndTaskInWorkspace(prisma as never, {
          projectId: 'project-1',
          taskId: 'task-1',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Task not found/i);
        return true;
      },
    );
  });

  it('verifyAssigneeInWorkspace throws for non-member assignee', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyAssigneeInWorkspace(prisma as never, {
          workspaceId: 'workspace-1',
          assigneeId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.match((error as Error).message, /Assignee is not a workspace member/i);
        return true;
      },
    );
  });

  it('verifyActiveTaskInWorkspace throws when task is not active in workspace', async () => {
    const prisma = {
      task: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyActiveTaskInWorkspace(prisma as never, {
          taskId: 'task-1',
          workspaceId: 'workspace-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Task not found/i);
        return true;
      },
    );
  });

  it('findTaskWithProjectInWorkspaceOrThrow returns project state payload', async () => {
    const prisma = {
      task: {
        findFirst: async () => ({
          project: {
            deletedAt: null,
            workspace: { deletedAt: null },
          },
        }),
      },
    } satisfies PrismaMock;

    const task = await findTaskWithProjectInWorkspaceOrThrow(prisma as never, {
      taskId: 'task-1',
      workspaceId: 'workspace-1',
    });

    assert.equal(task.project.deletedAt, null);
    assert.equal(task.project.workspace.deletedAt, null);
  });
});

describe('workspace-member.helper', () => {
  it('verifyWorkspaceMembership throws when user is not member', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyWorkspaceMembership(prisma as never, {
          workspaceId: 'workspace-1',
          userId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Workspace not found/i);
        return true;
      },
    );
  });

  it('verifyWorkspaceAdminOrOwner throws for non-admin role', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async () => ({ role: 'member' }),
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyWorkspaceAdminOrOwner(prisma as never, {
          workspaceId: 'workspace-1',
          userId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        assert.match((error as Error).message, /owner hoặc admin/i);
        return true;
      },
    );
  });

  it('verifyActiveWorkspaceForUser passes when workspace exists and active', async () => {
    const prisma = {
      workspace: {
        findFirst: async () => ({ id: 'workspace-1' }),
      },
    } satisfies PrismaMock;

    await verifyActiveWorkspaceForUser(prisma as never, {
      workspaceId: 'workspace-1',
      userId: 'user-1',
    });

    assert.ok(true);
  });

  it('verifyArchivedWorkspaceForUser throws when archived workspace not found', async () => {
    const prisma = {
      workspace: {
        findFirst: async () => null,
      },
    } satisfies PrismaMock;

    await assert.rejects(
      () =>
        verifyArchivedWorkspaceForUser(prisma as never, {
          workspaceId: 'workspace-1',
          userId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.match((error as Error).message, /Workspace not found/i);
        return true;
      },
    );
  });
});

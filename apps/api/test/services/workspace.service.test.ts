import assert from 'node:assert/strict';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it } from 'node:test';
import { WorkspaceService } from '../../src/modules/workspace/workspace.service';

type PrismaMock = Record<string, unknown>;

describe('WorkspaceService', () => {
  it('archiveWorkspaceForUser sets deletedAt', async () => {
    const archivedAt = new Date();
    let updatedData: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findFirst: async () => ({ id: 'workspace-1' }),
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data;
          return { id: 'workspace-1' };
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.archiveWorkspaceForUser({
      workspaceId: 'workspace-1',
      userId: 'user-1',
      archivedAt,
    });

    assert.equal(updatedData?.['deletedAt'], archivedAt);
  });

  it('getWorkspacesByUser filters deleted records by default', async () => {
    let whereArg: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          whereArg = where;
          return [];
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.getWorkspacesByUser('user-1');

    assert.equal(whereArg?.['deletedAt'], null);
  });

  it('getWorkspacesByUser includes deleted records when showArchived=true', async () => {
    let whereArg: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findMany: async ({ where }: { where: Record<string, unknown> }) => {
          whereArg = where;
          return [];
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.getWorkspacesByUser('user-1', { showArchived: true });

    assert.equal(whereArg?.['deletedAt'], undefined);
  });

  it('removeMemberFromWorkspace soft-deletes membership and clears default workspace', async () => {
    const removedAt = new Date();
    const calls: string[] = [];
    let membershipUpdateData: Record<string, unknown> | null = null;
    let userUpdateData: Record<string, unknown> | null = null;

    const prisma = {
      workspaceMember: {
        findFirst: async ({ select }: { select: Record<string, boolean> }) => {
          if (select['role']) {
            return { role: 'admin' };
          }
          if (select['userId']) {
            return { id: 'member-2', userId: 'user-2', role: 'member' };
          }
          return { id: 'member-2' };
        },
      },
      $transaction: async (fn: (tx: Record<string, unknown>) => Promise<void>) =>
        fn({
          workspaceMember: {
            update: async ({ data }: { data: Record<string, unknown> }) => {
              calls.push('membership.update');
              membershipUpdateData = data;
              return { id: 'member-2' };
            },
          },
          user: {
            updateMany: async ({ data }: { data: Record<string, unknown> }) => {
              calls.push('user.updateMany');
              userUpdateData = data;
              return { count: 1 };
            },
          },
        }),
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.removeMemberFromWorkspace({
      workspaceId: 'workspace-1',
      memberId: 'member-2',
      currentUserId: 'user-1',
      removedAt,
    });

    assert.deepEqual(calls, ['membership.update', 'user.updateMany']);
    assert.equal(membershipUpdateData?.['deletedAt'], removedAt);
    assert.equal(userUpdateData?.['defaultWorkspaceId'], null);
  });

  it('removeMemberFromWorkspace blocks self-removal', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async ({ select }: { select: Record<string, boolean> }) => {
          if (select['id'] && select['userId']) {
            return { id: 'member-1', userId: 'user-1', role: 'admin' };
          }

          if (select['role']) {
            return { role: 'owner' };
          }

          return null;
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await assert.rejects(
      () =>
        service.removeMemberFromWorkspace({
          workspaceId: 'workspace-1',
          memberId: 'member-1',
          currentUserId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        const response = (error as BadRequestException).getResponse();
        const message =
          typeof response === 'object' && response !== null && 'message' in response
            ? (response as { message?: string | string[] }).message
            : (error as Error).message;

        if (Array.isArray(message)) {
          assert.ok(message.some((entry) => /Không thể tự xóa chính mình/i.test(entry)));
        } else {
          assert.match(message ?? '', /Không thể tự xóa chính mình/i);
        }
        return true;
      },
    );
  });

  it('addMemberToWorkspace creates membership with default member role', async () => {
    let createdData: Record<string, unknown> | null = null;

    const prisma = {
      workspaceMember: {
        findFirst: async ({
          where,
          select,
        }: {
          where: Record<string, unknown>;
          select: Record<string, boolean>;
        }) => {
          if (select['role']) {
            return { role: 'admin' };
          }

          if ('userId' in where) {
            return null;
          }

          return null;
        },
        create: async ({ data }: { data: Record<string, unknown> }) => {
          createdData = data;
          return { id: 'member-2' };
        },
      },
      user: {
        findFirst: async () => ({ id: 'user-2' }),
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.addMemberToWorkspace({
      workspaceId: 'workspace-1',
      currentUserId: 'user-1',
      email: 'new.member@techviet.local',
    });

    assert.equal(createdData?.['workspaceId'], 'workspace-1');
    assert.equal(createdData?.['userId'], 'user-2');
    assert.equal(createdData?.['role'], 'member');
  });

  it('addMemberToWorkspace restores archived membership', async () => {
    let updatedData: Record<string, unknown> | null = null;

    const prisma = {
      workspaceMember: {
        findFirst: async ({
          where,
          select,
        }: {
          where: Record<string, unknown>;
          select: Record<string, boolean>;
        }) => {
          if (select['role']) {
            return { role: 'owner' };
          }

          if ('userId' in where) {
            return {
              id: 'member-2',
              deletedAt: new Date(),
            };
          }

          return null;
        },
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updatedData = data;
          return { id: 'member-2' };
        },
      },
      user: {
        findFirst: async () => ({ id: 'user-2' }),
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.addMemberToWorkspace({
      workspaceId: 'workspace-1',
      currentUserId: 'user-1',
      email: 'archived.member@techviet.local',
      role: 'viewer',
    });

    assert.equal(updatedData?.['role'], 'viewer');
    assert.equal(updatedData?.['deletedAt'], null);
  });

  it('addMemberToWorkspace rejects owner role', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async () => ({ role: 'admin' }),
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await assert.rejects(
      () =>
        service.addMemberToWorkspace({
          workspaceId: 'workspace-1',
          currentUserId: 'user-1',
          email: 'owner.member@techviet.local',
          role: 'owner',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });

  it('transferWorkspaceOwnership demotes current owner and promotes target member', async () => {
    const updates: Array<{ id: string; role: string }> = [];

    const prisma = {
      workspaceMember: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) => {
          if (where['userId'] === 'user-1') {
            return { id: 'member-1', role: 'owner' };
          }

          if (where['id'] === 'member-2') {
            return { id: 'member-2', userId: 'user-2' };
          }

          return null;
        },
      },
      $transaction: async (fn: (tx: Record<string, unknown>) => Promise<void>) =>
        fn({
          workspaceMember: {
            update: async ({ where, data }: { where: { id: string }; data: { role: string } }) => {
              updates.push({ id: where.id, role: data.role });
              return { id: where.id };
            },
          },
        }),
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.transferWorkspaceOwnership({
      workspaceId: 'workspace-1',
      memberId: 'member-2',
      currentUserId: 'user-1',
    });

    assert.deepEqual(updates, [
      { id: 'member-1', role: 'admin' },
      { id: 'member-2', role: 'owner' },
    ]);
  });

  it('transferWorkspaceOwnership blocks transferring to self', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) => {
          if (where['userId'] === 'user-1') {
            return { id: 'member-1', role: 'owner' };
          }

          if (where['id'] === 'member-1') {
            return { id: 'member-1', userId: 'user-1' };
          }

          return null;
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await assert.rejects(
      () =>
        service.transferWorkspaceOwnership({
          workspaceId: 'workspace-1',
          memberId: 'member-1',
          currentUserId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        return true;
      },
    );
  });

  it('transferWorkspaceOwnership requires current user to be owner', async () => {
    const prisma = {
      workspaceMember: {
        findFirst: async ({ where }: { where: Record<string, unknown> }) => {
          if (where['userId'] === 'user-1') {
            return { id: 'member-1', role: 'admin' };
          }

          return null;
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await assert.rejects(
      () =>
        service.transferWorkspaceOwnership({
          workspaceId: 'workspace-1',
          memberId: 'member-2',
          currentUserId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof ForbiddenException);
        return true;
      },
    );
  });

  it('setDefaultWorkspaceForUser updates defaultWorkspaceId', async () => {
    let userUpdateData: Record<string, unknown> | null = null;

    const prisma = {
      workspace: {
        findFirst: async () => ({ id: 'workspace-1' }),
      },
      user: {
        updateMany: async ({ data }: { data: Record<string, unknown> }) => {
          userUpdateData = data;
          return { count: 1 };
        },
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await service.setDefaultWorkspaceForUser({
      workspaceId: 'workspace-1',
      userId: 'user-1',
    });

    assert.equal(userUpdateData?.['defaultWorkspaceId'], 'workspace-1');
  });

  it('setDefaultWorkspaceForUser requires active membership', async () => {
    const prisma = {
      workspace: {
        findFirst: async () => null,
      },
      user: {
        updateMany: async () => ({ count: 1 }),
      },
    } satisfies PrismaMock;

    const service = new WorkspaceService(prisma as never);

    await assert.rejects(
      () =>
        service.setDefaultWorkspaceForUser({
          workspaceId: 'workspace-1',
          userId: 'user-1',
        }),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        return true;
      },
    );
  });
});

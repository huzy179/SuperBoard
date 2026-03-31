import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
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
});

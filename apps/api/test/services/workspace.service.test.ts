import assert from 'node:assert/strict';
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
});

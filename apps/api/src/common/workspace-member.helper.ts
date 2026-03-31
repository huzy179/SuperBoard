import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export async function verifyActiveWorkspaceForUser(
  prisma: PrismaService,
  input: { workspaceId: string; userId: string },
): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: input.workspaceId,
      deletedAt: null,
      members: {
        some: {
          userId: input.userId,
          deletedAt: null,
        },
      },
    },
    select: { id: true },
  });

  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyArchivedWorkspaceForUser(
  prisma: PrismaService,
  input: { workspaceId: string; userId: string },
): Promise<void> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: input.workspaceId,
      deletedAt: {
        not: null,
      },
      members: {
        some: {
          userId: input.userId,
          deletedAt: null,
        },
      },
    },
    select: { id: true },
  });

  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyWorkspaceMembership(
  prisma: PrismaService,
  input: { workspaceId: string; userId: string },
): Promise<void> {
  const membership = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!membership) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyWorkspaceAdminOrOwner(
  prisma: PrismaService,
  input: { workspaceId: string; userId: string },
): Promise<void> {
  const currentMember = await prisma.workspaceMember.findFirst({
    where: {
      workspaceId: input.workspaceId,
      userId: input.userId,
      deletedAt: null,
    },
    select: { role: true },
  });

  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
    throw new ForbiddenException('Chỉ owner hoặc admin mới được thay đổi role');
  }
}

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WorkspaceMemberRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type WorkspaceUserScope = {
  workspaceId: string;
  userId: string;
};

type WorkspaceMemberScope = {
  workspaceId: string;
  memberId: string;
};

type WorkspaceVisibility = 'active' | 'archived';

function buildActiveMembershipWhere(input: WorkspaceUserScope) {
  return {
    workspaceId: input.workspaceId,
    userId: input.userId,
  };
}

async function findWorkspaceForUserByVisibility(
  prisma: PrismaService,
  input: WorkspaceUserScope,
  visibility: WorkspaceVisibility,
): Promise<{ id: string } | null> {
  return prisma.workspace.findFirst({
    where: {
      id: input.workspaceId,
      deletedAt: visibility === 'active' ? null : { not: null },
      members: {
        some: {
          userId: input.userId,
        },
      },
    },
    select: { id: true },
  });
}

export async function verifyActiveWorkspaceForUser(
  prisma: PrismaService,
  input: WorkspaceUserScope,
): Promise<void> {
  const workspace = await findWorkspaceForUserByVisibility(prisma, input, 'active');

  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyArchivedWorkspaceForUser(
  prisma: PrismaService,
  input: WorkspaceUserScope,
): Promise<void> {
  const workspace = await findWorkspaceForUserByVisibility(prisma, input, 'archived');

  if (!workspace) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyWorkspaceMembership(
  prisma: PrismaService,
  input: WorkspaceUserScope,
): Promise<void> {
  const membership = await prisma.workspaceMember.findFirst({
    where: buildActiveMembershipWhere(input),
    select: { id: true },
  });

  if (!membership) {
    throw new NotFoundException('Workspace not found');
  }
}

export async function verifyWorkspaceAdminOrOwner(
  prisma: PrismaService,
  input: WorkspaceUserScope,
): Promise<void> {
  const currentMember = await prisma.workspaceMember.findFirst({
    where: buildActiveMembershipWhere(input),
    select: { role: true },
  });

  if (!currentMember || (currentMember.role !== 'owner' && currentMember.role !== 'admin')) {
    throw new ForbiddenException('Chỉ owner hoặc admin mới được thay đổi role');
  }
}

export async function findWorkspaceOwnerMembershipOrThrow(
  prisma: PrismaService,
  input: WorkspaceUserScope,
): Promise<{ id: string }> {
  const currentMember = await prisma.workspaceMember.findFirst({
    where: buildActiveMembershipWhere(input),
    select: { id: true, role: true },
  });

  if (!currentMember || currentMember.role !== 'owner') {
    throw new ForbiddenException('Chỉ owner mới được chuyển quyền sở hữu workspace');
  }

  return { id: currentMember.id };
}

export async function findMutableWorkspaceMemberOrThrow(
  prisma: PrismaService,
  input: WorkspaceMemberScope,
): Promise<{ id: string; userId: string }> {
  const targetMember = await prisma.workspaceMember.findFirst({
    where: {
      id: input.memberId,
      workspaceId: input.workspaceId,
    },
    select: { id: true, userId: true, role: true },
  });

  if (!targetMember) {
    throw new NotFoundException('Member not found');
  }

  if (targetMember.role === 'owner') {
    throw new ForbiddenException('Không thể thay đổi role của owner');
  }

  return { id: targetMember.id, userId: targetMember.userId };
}

export function parseWorkspaceMemberRoleOrThrow(role: string): WorkspaceMemberRole {
  if (role === 'owner' || role === 'admin' || role === 'member' || role === 'viewer') {
    return role;
  }

  throw new BadRequestException('Invalid role');
}

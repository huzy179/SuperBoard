import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  findWorkspaceOwnerMembershipOrThrow,
  findMutableWorkspaceMemberOrThrow,
  parseWorkspaceMemberRoleOrThrow,
  verifyActiveWorkspaceForUser,
  verifyArchivedWorkspaceForUser,
  verifyWorkspaceAdminOrOwner,
  verifyWorkspaceMembership,
} from '../../common/workspace-member.helper';
import { PrismaService } from '../../prisma/prisma.service';

type WorkspaceItemDTO = {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async getWorkspacesByUser(
    userId: string,
    options?: { showArchived?: boolean },
  ): Promise<WorkspaceItemDTO[]> {
    const where: Prisma.WorkspaceWhereInput = {
      members: {
        some: {
          userId,
          deletedAt: null,
        },
      },
      ...(options?.showArchived ? {} : { deletedAt: null }),
    };

    const workspaces = await this.prisma.workspace.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return workspaces.map((workspace) => this.toWorkspaceItemDTO(workspace));
  }

  async getWorkspaceByIdForUser(
    input: { workspaceId: string; userId: string },
    options?: { showArchived?: boolean },
  ): Promise<WorkspaceItemDTO | null> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        ...(options?.showArchived ? {} : { deletedAt: null }),
        members: {
          some: {
            userId: input.userId,
            deletedAt: null,
          },
        },
      } as Prisma.WorkspaceWhereInput,
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return workspace ? this.toWorkspaceItemDTO(workspace) : null;
  }

  async createWorkspaceForUser(input: {
    userId: string;
    name: string;
    slug?: string;
  }): Promise<WorkspaceItemDTO> {
    const normalizedName = input.name.trim();
    const slug = this.normalizeSlug(input.slug ?? normalizedName);

    const existingSlug = await this.prisma.workspace.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Workspace slug already exists');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: normalizedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          deletedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: input.userId,
          role: 'owner',
        },
      });

      await tx.user.updateMany({
        where: {
          id: input.userId,
          deletedAt: null,
          defaultWorkspaceId: null,
        },
        data: {
          defaultWorkspaceId: workspace.id,
        },
      });

      return workspace;
    });

    return this.toWorkspaceItemDTO(result);
  }

  async updateWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    name?: string;
    slug?: string;
  }): Promise<WorkspaceItemDTO> {
    await verifyActiveWorkspaceForUser(this.prisma, input);

    const normalizedName = input.name?.trim();
    const normalizedSlug = input.slug ? this.normalizeSlug(input.slug) : undefined;

    if (normalizedSlug) {
      const duplicateSlug = await this.prisma.workspace.findFirst({
        where: {
          slug: normalizedSlug,
          id: {
            not: input.workspaceId,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateSlug) {
        throw new BadRequestException('Workspace slug already exists');
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: {
        id: input.workspaceId,
      },
      data: {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(normalizedSlug !== undefined ? { slug: normalizedSlug } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toWorkspaceItemDTO(workspace);
  }

  async archiveWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    archivedAt?: Date;
  }): Promise<void> {
    await verifyActiveWorkspaceForUser(this.prisma, input);

    await this.prisma.workspace.update({
      where: { id: input.workspaceId },
      data: {
        deletedAt: input.archivedAt ?? new Date(),
      },
    });
  }

  async restoreWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    restoredAt?: Date;
  }): Promise<void> {
    await verifyArchivedWorkspaceForUser(this.prisma, input);

    await this.prisma.workspace.update({
      where: { id: input.workspaceId },
      data: {
        deletedAt: null,
      },
    });

    void input.restoredAt;
  }

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    await verifyWorkspaceMembership(this.prisma, { workspaceId, userId });

    const members = await this.prisma.workspaceMember.findMany({
      where: { workspaceId, deletedAt: null },
      select: {
        id: true,
        userId: true,
        role: true,
        createdAt: true,
        user: { select: { fullName: true, email: true, avatarColor: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      email: m.user.email,
      avatarColor: m.user.avatarColor ?? null,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }));
  }

  async updateMemberRole(input: {
    workspaceId: string;
    memberId: string;
    role: string;
    currentUserId: string;
  }) {
    await verifyWorkspaceAdminOrOwner(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.currentUserId,
    });

    await findMutableWorkspaceMemberOrThrow(this.prisma, {
      workspaceId: input.workspaceId,
      memberId: input.memberId,
    });

    const nextRole = parseWorkspaceMemberRoleOrThrow(input.role);

    await this.prisma.workspaceMember.update({
      where: { id: input.memberId },
      data: { role: nextRole },
    });
  }

  async addMemberToWorkspace(input: {
    workspaceId: string;
    currentUserId: string;
    email: string;
    role?: string;
  }): Promise<void> {
    await verifyWorkspaceAdminOrOwner(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.currentUserId,
    });

    const normalizedEmail = input.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required');
    }

    const nextRole = parseWorkspaceMemberRoleOrThrow(input.role ?? 'member');
    if (nextRole === 'owner') {
      throw new BadRequestException('Không thể thêm member với role owner');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMember = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: user.id,
      },
      select: {
        id: true,
        deletedAt: true,
      },
    });

    if (!existingMember) {
      await this.prisma.workspaceMember.create({
        data: {
          workspaceId: input.workspaceId,
          userId: user.id,
          role: nextRole,
        },
      });
      return;
    }

    if (!existingMember.deletedAt) {
      throw new BadRequestException('User is already a workspace member');
    }

    await this.prisma.workspaceMember.update({
      where: { id: existingMember.id },
      data: {
        role: nextRole,
        deletedAt: null,
      },
    });
  }

  async removeMemberFromWorkspace(input: {
    workspaceId: string;
    memberId: string;
    currentUserId: string;
    removedAt?: Date;
  }): Promise<void> {
    await verifyWorkspaceAdminOrOwner(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.currentUserId,
    });

    const targetMember = await findMutableWorkspaceMemberOrThrow(this.prisma, {
      workspaceId: input.workspaceId,
      memberId: input.memberId,
    });

    if (targetMember.userId === input.currentUserId) {
      throw new BadRequestException('Không thể tự xóa chính mình khỏi workspace');
    }

    const removedAt = input.removedAt ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.update({
        where: { id: targetMember.id },
        data: { deletedAt: removedAt },
      });

      await tx.user.updateMany({
        where: {
          id: targetMember.userId,
          defaultWorkspaceId: input.workspaceId,
          deletedAt: null,
        },
        data: {
          defaultWorkspaceId: null,
        },
      });
    });
  }

  async transferWorkspaceOwnership(input: {
    workspaceId: string;
    memberId: string;
    currentUserId: string;
  }): Promise<void> {
    const currentOwner = await findWorkspaceOwnerMembershipOrThrow(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.currentUserId,
    });

    const targetMember = await this.prisma.workspaceMember.findFirst({
      where: {
        id: input.memberId,
        workspaceId: input.workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found');
    }

    if (targetMember.userId === input.currentUserId) {
      throw new BadRequestException('Bạn đã là owner của workspace này');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.update({
        where: { id: currentOwner.id },
        data: { role: 'admin' },
      });

      await tx.workspaceMember.update({
        where: { id: targetMember.id },
        data: { role: 'owner' },
      });
    });
  }

  async setDefaultWorkspaceForUser(input: { workspaceId: string; userId: string }): Promise<void> {
    await verifyActiveWorkspaceForUser(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.userId,
    });

    await this.prisma.user.updateMany({
      where: {
        id: input.userId,
        deletedAt: null,
      },
      data: {
        defaultWorkspaceId: input.workspaceId,
      },
    });
  }

  private normalizeSlug(input: string): string {
    const slug = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      throw new BadRequestException('Workspace slug is required');
    }

    return slug;
  }

  private toWorkspaceItemDTO(workspace: {
    id: string;
    name: string;
    slug: string;
    deletedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): WorkspaceItemDTO {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      deletedAt: workspace.deletedAt ? workspace.deletedAt.toISOString() : null,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }
}

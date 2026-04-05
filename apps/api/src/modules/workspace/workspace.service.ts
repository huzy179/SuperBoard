import { createHash, randomBytes } from 'node:crypto';
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
import { NotificationService } from '../notification/notification.service';
import { logger } from '../../common/logger';

type WorkspaceItemDTO = {
  id: string;
  name: string;
  slug: string;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceInvitationTokenDTO = {
  token: string;
  email: string;
  role: string;
  expiresAt: string;
};

type WorkspaceInvitationItemDTO = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviterName: string;
};

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

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

  async createWorkspaceInvitation(input: {
    workspaceId: string;
    currentUserId: string;
    email: string;
    role?: string;
    expiresInHours?: number;
  }): Promise<WorkspaceInvitationTokenDTO> {
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
      throw new BadRequestException('Không thể mời member với role owner');
    }

    const expiresInHours = input.expiresInHours ?? 72;
    if (!Number.isInteger(expiresInHours) || expiresInHours <= 0 || expiresInHours > 24 * 30) {
      throw new BadRequestException('expiresInHours must be an integer between 1 and 720');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: normalizedEmail,
        deletedAt: null,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      const existingMembership = await this.prisma.workspaceMember.findFirst({
        where: {
          workspaceId: input.workspaceId,
          userId: existingUser.id,
          deletedAt: null,
        },
        select: {
          id: true,
        },
      });

      if (existingMembership) {
        throw new BadRequestException('User is already a workspace member');
      }
    }

    const now = new Date();
    const activePendingInvitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId: input.workspaceId,
        email: normalizedEmail,
        status: 'pending',
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (activePendingInvitation) {
      throw new BadRequestException('An active invitation already exists for this email');
    }

    const token = randomBytes(24).toString('hex');
    const tokenHash = this.hashInvitationToken(token);
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000);

    await this.prisma.workspaceInvitation.create({
      data: {
        workspaceId: input.workspaceId,
        inviterId: input.currentUserId,
        email: normalizedEmail,
        tokenHash,
        role: nextRole,
        status: 'pending',
        expiresAt,
      },
    });

    // Trigger Notification/Email
    try {
      const [inviter, workspace] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: input.currentUserId },
          select: { fullName: true },
        }),
        this.prisma.workspace.findUnique({
          where: { id: input.workspaceId },
          select: { name: true },
        }),
      ]);

      if (inviter && workspace) {
        // Find if user already exists to send in-app notification,
        // otherwise just email will be handled by NotificationService/EmailService based on preferences logic
        // Actually, for invitations to new users, we just want to send the email directly.
        // But our NotificationService expects a userId.
        // If the user doesn't exist, we should handle it separately or create a placeholder.
        // Recommendation: If user exists, send in-app + email. If not, send email only.

        if (existingUser) {
          await this.notificationService.createNotification({
            userId: existingUser.id,
            workspaceId: input.workspaceId,
            type: 'workspace_invite',
            payload: {
              token,
              inviterName: inviter.fullName,
              workspaceName: workspace.name,
            },
          });
        } else {
          // For non-existing users, we send email directly
          await this.notificationService.sendWorkspaceInvitation({
            email: normalizedEmail,
            inviterName: inviter.fullName,
            workspaceName: workspace.name,
            token,
          });
        }
      }
    } catch (error) {
      logger.error({ error }, 'Failed to send invitation notification');
    }

    return {
      token,
      email: normalizedEmail,
      role: nextRole,
      expiresAt: expiresAt.toISOString(),
    };
  }

  async acceptWorkspaceInvitation(input: { token: string; userId: string }): Promise<void> {
    const normalizedToken = input.token.trim();
    if (!normalizedToken) {
      throw new BadRequestException('Invitation token is required');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: input.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash: this.hashInvitationToken(normalizedToken),
      },
      select: {
        id: true,
        workspaceId: true,
        email: true,
        role: true,
        status: true,
        expiresAt: true,
      },
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException('Invitation not found');
    }

    const now = new Date();
    if (invitation.expiresAt <= now) {
      await this.prisma.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'expired',
        },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new BadRequestException('Invitation email does not match current user');
    }

    await this.prisma.$transaction(async (tx) => {
      const existingMembership = await tx.workspaceMember.findFirst({
        where: {
          workspaceId: invitation.workspaceId,
          userId: user.id,
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

      if (!existingMembership) {
        await tx.workspaceMember.create({
          data: {
            workspaceId: invitation.workspaceId,
            userId: user.id,
            role: invitation.role,
          },
        });
      } else if (existingMembership.deletedAt) {
        await tx.workspaceMember.update({
          where: { id: existingMembership.id },
          data: {
            role: invitation.role,
            deletedAt: null,
          },
        });
      } else {
        throw new BadRequestException('User is already a workspace member');
      }

      await tx.workspaceInvitation.update({
        where: { id: invitation.id },
        data: {
          status: 'accepted',
          acceptedAt: now,
        },
      });

      await tx.user.updateMany({
        where: {
          id: user.id,
          deletedAt: null,
          defaultWorkspaceId: null,
        },
        data: {
          defaultWorkspaceId: invitation.workspaceId,
        },
      });
    });
  }

  async getWorkspaceInvitations(
    workspaceId: string,
    userId: string,
  ): Promise<WorkspaceInvitationItemDTO[]> {
    await verifyWorkspaceAdminOrOwner(this.prisma, { workspaceId, userId });

    const invitations = await this.prisma.workspaceInvitation.findMany({
      where: { workspaceId, status: 'pending', expiresAt: { gt: new Date() } },
      include: {
        inviter: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      email: inv.email,
      role: inv.role,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      inviterName: inv.inviter.fullName,
    }));
  }

  async revokeWorkspaceInvitation(input: {
    workspaceId: string;
    invitationId: string;
    userId: string;
  }): Promise<void> {
    await verifyWorkspaceAdminOrOwner(this.prisma, {
      workspaceId: input.workspaceId,
      userId: input.userId,
    });

    const invitation = await this.prisma.workspaceInvitation.findFirst({
      where: {
        id: input.invitationId,
        workspaceId: input.workspaceId,
        status: 'pending',
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    await this.prisma.workspaceInvitation.update({
      where: { id: input.invitationId },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });
  }

  async getInvitationByToken(token: string) {
    const normalizedToken = token.trim();
    if (!normalizedToken) {
      throw new BadRequestException('Invitation token is required');
    }

    const invitation = await this.prisma.workspaceInvitation.findUnique({
      where: {
        tokenHash: this.hashInvitationToken(normalizedToken),
      },
      include: {
        workspace: { select: { id: true, name: true } },
        inviter: { select: { fullName: true } },
      },
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new NotFoundException('Invitation not found or already processed');
    }

    if (invitation.expiresAt <= new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    return {
      workspaceId: invitation.workspaceId,
      workspaceName: invitation.workspace.name,
      inviterName: invitation.inviter.fullName,
      email: invitation.email,
      role: invitation.role,
    };
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

  async leaveWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    leftAt?: Date;
  }): Promise<void> {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!membership) {
      throw new NotFoundException('Workspace not found');
    }

    if (membership.role === 'owner') {
      throw new BadRequestException('Owner không thể tự rời workspace');
    }

    const leftAt = input.leftAt ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.update({
        where: { id: membership.id },
        data: { deletedAt: leftAt },
      });

      await tx.user.updateMany({
        where: {
          id: input.userId,
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

  private hashInvitationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

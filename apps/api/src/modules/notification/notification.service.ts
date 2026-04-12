import { Injectable } from '@nestjs/common';
import type { Prisma, NotificationPreference } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { NotificationGateway } from './notification.gateway';
import { logger } from '../../common/logger';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private gateway: NotificationGateway,
  ) {}

  async getNotifications(userId: string, workspaceId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        type: true,
        payload: true,
        readAt: true,
        createdAt: true,
      },
    });

    const unreadCount = await this.prisma.notification.count({
      where: { userId, workspaceId, readAt: null },
    });

    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        payload: n.payload as Record<string, unknown>,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, workspaceId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, workspaceId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async createNotification(input: {
    userId: string;
    workspaceId: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });

    // Emit real-time notification
    void this.gateway.emitNotification(input.userId, {
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      createdAt: notification.createdAt.toISOString(),
    });

    // Handle Email Notifications
    try {
      const preferences = await this.getUserPreferences(input.userId);
      if (preferences.emailEnabled) {
        await this.handleEmailTrigger(input, preferences);
      }
    } catch (error) {
      logger.error({ error, userId: input.userId }, 'Failed to process email notification');
    }
  }

  async getUserPreferences(userId: string) {
    let preferences = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updatePreferences(userId: string, data: Partial<Prisma.NotificationPreferenceUpdateInput>) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: { ...data, userId } as Prisma.NotificationPreferenceCreateInput,
      update: data,
    });
  }

  private async handleEmailTrigger(
    input: { userId: string; type: string; payload: Record<string, unknown> },
    preferences: NotificationPreference,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, fullName: true },
    });

    if (!user) return;

    if (input.type === 'task_assigned' && preferences.taskAssignedEmail) {
      const payload = input.payload as Record<string, unknown>;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const taskUrl = `${baseUrl}/projects/${payload.projectId}/tasks/${payload.taskId}`;

      await this.emailService.sendTaskAssignedEmail(
        user.email,
        user.fullName,
        payload.taskTitle as string,
        taskUrl,
      );
    }

    if (input.type === 'workspace_invite' && preferences.workspaceInviteEmail) {
      const payload = input.payload as Record<string, unknown>;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteUrl = `${baseUrl}/invitation/${payload.token}`;

      await this.emailService.sendWorkspaceInviteEmail(
        user.email,
        payload.inviterName as string,
        payload.workspaceName as string,
        inviteUrl,
      );
    }

    if (input.type === 'comment_mention' && preferences.commentMentionEmail) {
      const payload = input.payload as Record<string, unknown>;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const taskUrl = `${baseUrl}/projects/${payload.projectId}/tasks/${payload.taskId}`;

      await this.emailService.sendCommentMentionEmail(
        user.email,
        user.fullName,
        payload.authorName as string,
        payload.taskTitle as string,
        payload.commentPreview as string,
        taskUrl,
      );
    }
  }

  async sendWorkspaceInvitation(input: {
    email: string;
    inviterName: string;
    workspaceName: string;
    token: string;
  }) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/invitation/${input.token}`;

    await this.emailService.sendWorkspaceInviteEmail(
      input.email,
      input.inviterName,
      input.workspaceName,
      inviteUrl,
    );
  }
}

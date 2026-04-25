import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { NotificationJobDTO } from '@superboard/shared';
import { ulid } from '@superboard/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { QueueService } from '../../common/queue.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
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
        neuralPriority: true,
        aiSummary: true,
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
        neuralPriority: n.neuralPriority,
        aiSummary: n.aiSummary,
        readAt: n.readAt?.toISOString() ?? null,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
    };
  }

  /**
   * Enqueue a typed notification job via BullMQ.
   * Core API enqueues and returns immediately — no delivery logic here.
   */
  async enqueueNotificationJob(job: NotificationJobDTO): Promise<void> {
    await this.queueService.addJob('SEND_NOTIFICATION', job as unknown as Record<string, unknown>);
  }

  /**
   * Persist an in-app notification to DB and emit real-time push.
   * Called by the Notification Service worker via internal endpoint.
   */
  async persistInAppNotification(input: {
    id: string;
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
        neuralPriority: 'AMBIENT',
        aiSummary: null,
      },
    });

    void this.gateway.emitNotification(input.userId, {
      id: notification.id,
      type: notification.type,
      payload: notification.payload,
      neuralPriority: notification.neuralPriority,
      aiSummary: notification.aiSummary,
      createdAt: notification.createdAt.toISOString(),
    });

    return notification;
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
    correlationId?: string;
  }) {
    // Enqueue in-app notification job — fire-and-forget, Core API returns immediately.
    // The Notification Service worker handles DB write and real-time push.
    void this.enqueueNotificationJob({
      id: ulid(),
      correlationId: input.correlationId ?? '',
      type: 'in-app',
      recipientId: input.userId,
      payload: {
        title: input.type,
        metadata: {
          ...input.payload,
          workspaceId: input.workspaceId,
        },
      },
      createdAt: new Date().toISOString(),
    });

    // Enqueue email notification job — fire-and-forget
    void this.enqueueNotificationJob({
      id: ulid(),
      correlationId: input.correlationId ?? '',
      type: 'email',
      recipientId: input.userId,
      payload: {
        title: input.type,
        metadata: input.payload,
      },
      createdAt: new Date().toISOString(),
    });
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

  async sendWorkspaceInvitation(input: {
    email: string;
    inviterName: string;
    workspaceName: string;
    token: string;
  }) {
    // Enqueue email job — fire-and-forget
    void this.enqueueNotificationJob({
      id: ulid(),
      correlationId: '',
      type: 'email',
      recipientId: input.email,
      payload: {
        title: 'workspace_invite',
        metadata: input as unknown as Record<string, unknown>,
      },
      createdAt: new Date().toISOString(),
    });
  }
}

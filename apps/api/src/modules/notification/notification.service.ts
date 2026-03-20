import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(userId: string, workspaceId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId, workspaceId, deletedAt: null },
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
      where: { userId, workspaceId, deletedAt: null, readAt: null },
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
      where: { userId, workspaceId, readAt: null, deletedAt: null },
      data: { readAt: new Date() },
    });
  }

  async createNotification(input: {
    userId: string;
    workspaceId: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    await this.prisma.notification.create({
      data: {
        userId: input.userId,
        workspaceId: input.workspaceId,
        type: input.type,
        payload: input.payload as Prisma.InputJsonValue,
      },
    });
  }
}

/**
 * Notification Service AMQP Event Consumer
 *
 * Subscribes to the "notification.domain.events" RabbitMQ queue and maps domain events
 * to notification jobs enqueued on the BullMQ "notifications" queue.
 *
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7
 */
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { MessageProcessingContext } from '@superboard/backend-shared/amqp';
import { BaseAMQPConsumer } from '@superboard/backend-shared/amqp';
import { MetricsService } from '@superboard/backend-shared/metrics';
import type { DomainEvent, NotificationJobDTO } from '@superboard/shared';
import { ulid, RABBITMQ_EXCHANGES, RABBITMQ_QUEUES, RABBITMQ_DLQ_NAMES } from '@superboard/shared';
import { NotificationMetricsService } from '../metrics/notification-metrics.service';

const NOTIF_QUEUE_NAME = 'notifications';

/** All event types from the Event Taxonomy v1 that trigger notifications. */
const NOTIFICATION_EVENT_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.status_changed',
  'doc.updated',
  'doc.version_created',
  'message.sent',
  'message.reaction_added',
  'project.updated',
  'user.invited',
  'user.member_joined',
]);

@Injectable()
export class AmqpEventConsumerService
  extends BaseAMQPConsumer<DomainEvent>
  implements OnModuleInit, OnModuleDestroy
{
  private notifQueue: Queue | null = null;

  constructor(
    private readonly configService: ConfigService,
    metricsService: MetricsService,
    private readonly notifMetrics: NotificationMetricsService,
  ) {
    const rabbitmqUrl = configService.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
    const prefetchCount = parseInt(
      configService.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10',
      10,
    );

    super({
      serviceName: 'notification',
      metricsService,
      config: {
        url: rabbitmqUrl,
        exchange: RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
        queue: RABBITMQ_QUEUES.NOTIFICATION,
        routingKeys: ['#'],
        prefetchCount,
        reconnectInterval: 1000,
        maxReconnectAttempts: 10,
        deadLetterExchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        deadLetterQueue: RABBITMQ_DLQ_NAMES.NOTIFICATION,
      },
      deadLetter: {
        exchange: RABBITMQ_EXCHANGES.DEAD_LETTER,
        queue: RABBITMQ_DLQ_NAMES.NOTIFICATION,
        routingKey: RABBITMQ_QUEUES.NOTIFICATION,
        ttl: 604800000, // 7 days
      },
      shouldProcess: (event) => NOTIFICATION_EVENT_TYPES.has(event.eventType),
      parseMessage: (msg) => JSON.parse(msg.content.toString('utf8')) as DomainEvent,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.setupBullMQQueue();
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
    await this.notifQueue?.close();
  }

  private async setupBullMQQueue(): Promise<void> {
    const redisUrl = this.configService.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
    };

    this.notifQueue = new Queue(NOTIF_QUEUE_NAME, { connection });
  }

  protected async processMessage(
    event: DomainEvent,
    context: MessageProcessingContext,
  ): Promise<void> {
    this.logger.log(`[amqp-consumer] received event '${event.eventType}'`, {
      correlationId: context.correlationId,
    });

    try {
      const jobs = this.mapEventToNotificationJobs(event);
      if (jobs.length === 0) return;

      for (const job of jobs) {
        await this.notifQueue!.add(job.type, job, {
          jobId: event.idempotencyKey, // Use event idempotencyKey as BullMQ job ID for deduplication
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
        });
      }

      this.notifMetrics.recordEventProcessed(event.eventType);
    } catch (error) {
      this.notifMetrics.recordRabbitmqEventFailure(event.eventType);
      throw error;
    }
  }

  /**
   * Map a domain event to one or more notification jobs.
   * Each event type maps to a specific notification type and recipient resolution strategy.
   */
  private mapEventToNotificationJobs(event: DomainEvent): NotificationJobDTO[] {
    const payload = event.payload as Record<string, unknown>;
    const base = {
      correlationId: event.correlationId,
      createdAt: new Date().toISOString(),
    };

    switch (event.eventType) {
      case 'task.created':
        return [
          {
            ...base,
            id: ulid(),
            type: 'in-app',
            recipientId: (payload.assigneeId as string) ?? (payload.creatorId as string),
            payload: {
              title: 'New task assigned',
              body: `Task "${payload.title}" was created`,
              actionUrl: `/projects/${payload.projectId}/tasks/${payload.taskId}`,
              metadata: { taskId: payload.taskId, workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'task.status_changed':
        return [
          {
            ...base,
            id: ulid(),
            type: 'in-app',
            recipientId: payload.changedBy as string,
            payload: {
              title: 'Task status updated',
              body: `Task status changed from ${payload.oldStatus} to ${payload.newStatus}`,
              actionUrl: `/projects/${payload.projectId}/tasks/${payload.taskId}`,
              metadata: { taskId: payload.taskId, workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'message.sent':
        return [
          {
            ...base,
            id: ulid(),
            type: 'in-app',
            recipientId: payload.recipientId as string,
            payload: {
              title: 'New message',
              body: payload.preview as string,
              actionUrl: `/channels/${payload.channelId}`,
              metadata: { channelId: payload.channelId, workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'user.invited':
        return [
          {
            ...base,
            id: ulid(),
            type: 'email',
            recipientId: payload.inviteeId as string,
            payload: {
              title: 'You have been invited',
              body: `You were invited to workspace ${payload.workspaceId}`,
              actionUrl: `/invite/${payload.inviteToken}`,
              metadata: { workspaceId: payload.workspaceId },
            },
          },
        ];

      case 'user.member_joined':
        return [
          {
            ...base,
            id: ulid(),
            type: 'in-app',
            recipientId: payload.userId as string,
            payload: {
              title: 'Welcome!',
              body: `You joined workspace ${payload.workspaceId}`,
              actionUrl: `/workspaces/${payload.workspaceId}`,
              metadata: { workspaceId: payload.workspaceId },
            },
          },
        ];

      // For other event types, emit a generic in-app notification if recipientId is available
      default: {
        const recipientId = payload.recipientId as string | undefined;
        if (!recipientId) return [];
        return [
          {
            ...base,
            id: ulid(),
            type: 'in-app',
            recipientId,
            payload: {
              title: `Event: ${event.eventType}`,
              metadata: { eventId: event.eventId, workspaceId: payload.workspaceId },
            },
          },
        ];
      }
    }
  }
}

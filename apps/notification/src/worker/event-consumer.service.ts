/**
 * Notification Service Event Consumer
 *
 * Subscribes to the "domain-events" BullMQ queue and maps domain events
 * to notification jobs enqueued on the "notifications" queue.
 *
 * Requirements: 13.2, 13.3
 */
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job, Queue } from 'bullmq';
import type { DomainEvent, NotificationJobDTO } from '@superboard/shared';
import { ulid } from '@superboard/shared';
import { NotificationMetricsService } from '../metrics/notification-metrics.service';

const EVENT_QUEUE_NAME = 'domain-events';
const EVENT_DLQ_NAME = 'domain-events:failed';
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
export class EventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventConsumerService.name);
  private worker: Worker | null = null;
  private notifQueue: Queue | null = null;
  private dlqQueue: Queue | null = null;
  private maxAttempts: number = 3;
  private dlqDepthInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: NotificationMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.maxAttempts = parseInt(this.config.get<string>('EVENT_CONSUMER_MAX_RETRIES') ?? '3', 10);

    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
    };

    this.notifQueue = new Queue(NOTIF_QUEUE_NAME, { connection });
    this.dlqQueue = new Queue(EVENT_DLQ_NAME, { connection });

    this.worker = new Worker(
      EVENT_QUEUE_NAME,
      async (job: Job) => {
        await this.handleEvent(job.data as DomainEvent);
      },
      {
        connection,
        concurrency: 5,
        // BullMQ built-in retry with exponential backoff
        settings: {
          backoffStrategy: (attemptsMade: number) =>
            Math.min(1000 * Math.pow(2, attemptsMade - 1), 30000),
        },
      },
    );

    this.worker.on('completed', (job) => {
      const event = job.data as DomainEvent;
      this.logger.log(`[event-consumer] processed event '${event.eventType}' (job=${job.id})`);
      this.metrics.recordEventProcessed(event.eventType);
    });

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      const event = job.data as DomainEvent;
      this.logger.error(
        `[event-consumer] failed event '${event.eventType}' (job=${job.id}, attempt=${job.attemptsMade}/${this.maxAttempts}): ${err.message}`,
        { correlationId: event.correlationId },
      );

      if (job.attemptsMade >= this.maxAttempts) {
        this.logger.warn(
          `[event-consumer] event '${event.eventType}' exhausted retries — moving to DLQ '${EVENT_DLQ_NAME}'`,
          { correlationId: event.correlationId },
        );
        await this.dlqQueue?.add(event.eventType, {
          event,
          _dlqReason: err.message,
          _dlqAt: new Date().toISOString(),
          _originalJobId: job.id,
        });
        this.metrics.recordEventDlq(event.eventType);
      }
    });

    // Poll DLQ depth every 30s
    this.dlqDepthInterval = setInterval(async () => {
      try {
        const counts = await this.dlqQueue?.getJobCounts('waiting', 'delayed', 'failed');
        const depth = (counts?.waiting ?? 0) + (counts?.delayed ?? 0) + (counts?.failed ?? 0);
        this.metrics.setEventDlqDepth(depth);
      } catch {
        // ignore
      }
    }, 30000);

    this.logger.log(
      `[event-consumer] started, listening on queue '${EVENT_QUEUE_NAME}', maxAttempts=${this.maxAttempts}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.dlqDepthInterval) clearInterval(this.dlqDepthInterval);
    await this.worker?.close();
    await this.notifQueue?.close();
    await this.dlqQueue?.close();
  }

  /**
   * Route a domain event to the appropriate notification job(s).
   */
  async handleEvent(event: DomainEvent): Promise<void> {
    if (!NOTIFICATION_EVENT_TYPES.has(event.eventType)) {
      this.logger.debug(`[event-consumer] ignoring unsupported event type '${event.eventType}'`);
      return;
    }

    const jobs = this.mapEventToNotificationJobs(event);
    if (jobs.length === 0) {
      this.logger.debug(
        `[event-consumer] no notification jobs mapped for event '${event.eventType}'`,
      );
      return;
    }

    for (const job of jobs) {
      await this.notifQueue!.add(job.type, job, {
        jobId: job.id,
        attempts: this.maxAttempts,
        backoff: { type: 'exponential', delay: 1000 },
      });
      this.logger.log(
        `[event-consumer] enqueued notification job '${job.id}' [${job.type}] for event '${event.eventType}'`,
        { correlationId: event.correlationId },
      );
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

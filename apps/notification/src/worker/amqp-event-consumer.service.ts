/**
 * Notification Service AMQP Event Consumer
 *
 * Subscribes to the "notification.domain.events" RabbitMQ queue and maps domain events
 * to notification jobs enqueued on the BullMQ "notifications" queue.
 *
 * Requirements: 5.1, 5.3, 5.4, 5.5, 5.6, 5.7
 */
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { connect, ChannelModel, Channel, ConsumeMessage } from 'amqplib';
import type { DomainEvent, NotificationJobDTO } from '@superboard/shared';
import { ulid, RABBITMQ_EXCHANGES, RABBITMQ_QUEUES } from '@superboard/shared';
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
export class AmqpEventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AmqpEventConsumerService.name);
  private connection: ChannelModel | null = null;
  private channel: Channel | null = null;
  private notifQueue: Queue | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectBaseDelay = 1000; // 1 second
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly metrics: NotificationMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.setupBullMQQueue();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    await this.disconnect();
  }

  private async connect(): Promise<void> {
    try {
      const rabbitmqUrl = this.config.get<string>('RABBITMQ_URL') ?? 'amqp://localhost:5672';
      const prefetchCount = parseInt(
        this.config.get<string>('RABBITMQ_PREFETCH_COUNT') ?? '10',
        10,
      );

      this.connection = await connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Set prefetch count
      await this.channel.prefetch(prefetchCount);

      // Setup connection error handlers for reconnection
      this.connection.on('error', (err) => {
        this.logger.error(`AMQP connection error: ${err.message}`);
        this.scheduleReconnect();
      });

      this.connection.on('close', () => {
        this.logger.warn('AMQP connection closed');
        this.scheduleReconnect();
      });

      await this.declareAndBind();
      await this.startConsuming();

      this.reconnectAttempts = 0; // Reset on successful connection
      this.logger.log(
        `AMQP consumer connected and consuming from queue: ${RABBITMQ_QUEUES.NOTIFICATION}`,
      );
    } catch (error) {
      this.logger.error(`Failed to connect to AMQP: ${error}`);
      this.scheduleReconnect();
    }
  }

  private async declareAndBind(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    // Declare exchanges (idempotent)
    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'topic', { durable: true });
    await this.channel.assertExchange(RABBITMQ_EXCHANGES.DEAD_LETTER, 'topic', { durable: true });

    // Declare notification queue with DLX
    await this.channel.assertQueue(RABBITMQ_QUEUES.NOTIFICATION, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': RABBITMQ_EXCHANGES.DEAD_LETTER,
      },
    });

    // Bind to all events (routing key '#')
    await this.channel.bindQueue(
      RABBITMQ_QUEUES.NOTIFICATION,
      RABBITMQ_EXCHANGES.DOMAIN_EVENTS,
      '#',
    );

    this.logger.log(
      `Queue ${RABBITMQ_QUEUES.NOTIFICATION} declared and bound to exchange ${RABBITMQ_EXCHANGES.DOMAIN_EVENTS}`,
    );
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) throw new Error('Channel not available');

    await this.channel.consume(RABBITMQ_QUEUES.NOTIFICATION, (msg) => {
      if (msg) {
        this.handleMessage(msg).catch((error) => {
          this.logger.error(`Error handling message: ${error}`);
          // NACK with requeue=false to send to DLQ
          this.channel?.nack(msg, false, false);
        });
      }
    });
  }

  private async handleMessage(msg: ConsumeMessage): Promise<void> {
    try {
      const event: DomainEvent = JSON.parse(msg.content.toString());

      this.logger.log(
        `[amqp-consumer] received event '${event.eventType}' (messageId=${msg.properties.messageId})`,
        { correlationId: event.correlationId },
      );

      // Check if this event type should trigger notifications
      if (!NOTIFICATION_EVENT_TYPES.has(event.eventType)) {
        this.logger.debug(`[amqp-consumer] ignoring unsupported event type '${event.eventType}'`);
        this.channel!.ack(msg);
        return;
      }

      // Map event to notification jobs
      const jobs = this.mapEventToNotificationJobs(event);
      if (jobs.length === 0) {
        this.logger.debug(
          `[amqp-consumer] no notification jobs mapped for event '${event.eventType}'`,
        );
        this.channel!.ack(msg);
        return;
      }

      // Enqueue jobs to BullMQ with idempotency key
      for (const job of jobs) {
        await this.notifQueue!.add(job.type, job, {
          jobId: event.idempotencyKey, // Use event idempotencyKey as BullMQ job ID for deduplication
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
        });

        this.logger.log(
          `[amqp-consumer] enqueued notification job '${job.id}' [${job.type}] for event '${event.eventType}' with jobId=${event.idempotencyKey}`,
          { correlationId: event.correlationId },
        );
      }

      // Record metrics
      this.metrics.recordEventProcessed(event.eventType);

      // ACK only after successful BullMQ enqueue
      this.channel!.ack(msg);
    } catch (error) {
      this.logger.error(`Failed to process AMQP message: ${error}`);

      // Record failure metric if we can parse the event
      try {
        const event: DomainEvent = JSON.parse(msg.content.toString());
        this.metrics.recordRabbitmqEventFailure(event.eventType);
      } catch {
        // If we can't parse the event, record with unknown type
        this.metrics.recordRabbitmqEventFailure('unknown');
      }

      // NACK with requeue=false to send to DLQ
      this.channel!.nack(msg, false, false);
      throw error;
    }
  }

  private async setupBullMQQueue(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
    };

    this.notifQueue = new Queue(NOTIF_QUEUE_NAME, { connection });
  }

  private scheduleReconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.logger.error(
          `Max reconnection attempts (${this.maxReconnectAttempts}) reached. Giving up.`,
        );
        resolve();
        return;
      }

      const delay = Math.min(
        this.reconnectBaseDelay * Math.pow(2, this.reconnectAttempts),
        30000, // Max 30 seconds
      );

      this.reconnectAttempts++;
      this.logger.log(
        `Scheduling AMQP reconnection attempt ${this.reconnectAttempts} in ${delay}ms`,
      );

      this.reconnectTimer = setTimeout(async () => {
        try {
          await this.disconnect();
          await this.connect();
          resolve();
        } catch (error) {
          this.logger.error(`Reconnection attempt ${this.reconnectAttempts} failed: ${error}`);
          resolve();
        }
      }, delay);
    });
  }

  private async disconnect(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      await this.notifQueue?.close();
    } catch (error) {
      this.logger.error(`Error during disconnect: ${error}`);
    } finally {
      this.channel = null;
      this.connection = null;
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

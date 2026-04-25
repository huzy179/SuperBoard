/**
 * Automation Service Event Consumer
 *
 * Subscribes to the "domain-events" BullMQ queue and executes automation rules
 * based on domain events. This is a mock implementation for Pha 6 foundation.
 *
 * Requirements: 17.2, 17.4
 */
import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job, Queue } from 'bullmq';
import type { DomainEvent } from '@superboard/shared';

const EVENT_QUEUE_NAME = 'domain-events';
const EVENT_DLQ_NAME = 'domain-events:failed';

/** Event types that can trigger automation rules. */
const AUTOMATION_EVENT_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.status_changed',
  'project.updated',
  'user.member_joined',
]);

@Injectable()
export class AutomationEventConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationEventConsumerService.name);
  private worker: Worker | null = null;
  private dlqQueue: Queue | null = null;
  private maxAttempts: number = 3;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.maxAttempts = parseInt(this.config.get<string>('EVENT_CONSUMER_MAX_RETRIES') ?? '3', 10);

    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
    };

    this.dlqQueue = new Queue(EVENT_DLQ_NAME, { connection });

    this.worker = new Worker(
      EVENT_QUEUE_NAME,
      async (job: Job) => {
        await this.handleEvent(job.data as DomainEvent);
      },
      {
        connection,
        concurrency: 5,
        settings: {
          backoffStrategy: (attemptsMade: number) =>
            Math.min(1000 * Math.pow(2, attemptsMade - 1), 30000),
        },
      },
    );

    this.worker.on('completed', (job) => {
      const event = job.data as DomainEvent;
      this.logger.log(
        `[automation-consumer] executed rules for event '${event.eventType}' (job=${job.id})`,
      );
    });

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      const event = job.data as DomainEvent;
      this.logger.error(
        `[automation-consumer] failed '${event.eventType}' (job=${job.id}, attempt=${job.attemptsMade}/${this.maxAttempts}): ${err.message}`,
        { correlationId: event.correlationId },
      );

      if (job.attemptsMade >= this.maxAttempts) {
        await this.dlqQueue?.add(event.eventType, {
          event,
          _dlqReason: err.message,
          _dlqAt: new Date().toISOString(),
          _originalJobId: job.id,
        });
        this.logger.warn(
          `[automation-consumer] event '${event.eventType}' routed to DLQ '${EVENT_DLQ_NAME}'`,
        );
      }
    });

    this.logger.log(`[automation-consumer] started, listening on queue '${EVENT_QUEUE_NAME}'`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
    await this.dlqQueue?.close();
  }

  /**
   * Handle a domain event by evaluating and executing automation rules.
   * Mock implementation — logs the rule execution action.
   */
  async handleEvent(event: DomainEvent): Promise<void> {
    if (!AUTOMATION_EVENT_TYPES.has(event.eventType)) {
      this.logger.debug(`[automation-consumer] ignoring event type '${event.eventType}'`);
      return;
    }

    const payload = event.payload as Record<string, unknown>;
    this.logger.log(
      `[automation-consumer] evaluating automation rules for event '${event.eventType}' ` +
        `(correlationId=${event.correlationId})`,
    );

    // Mock: log the rule execution per event type
    switch (event.eventType) {
      case 'task.created':
        this.logger.log(
          `[automation-consumer] [mock] evaluate rules: task created taskId=${payload.taskId}`,
        );
        break;
      case 'task.status_changed':
        this.logger.log(
          `[automation-consumer] [mock] evaluate rules: task status changed ` +
            `taskId=${payload.taskId} ${payload.oldStatus} → ${payload.newStatus}`,
        );
        break;
      case 'project.updated':
        this.logger.log(
          `[automation-consumer] [mock] evaluate rules: project updated projectId=${payload.projectId}`,
        );
        break;
      case 'user.member_joined':
        this.logger.log(
          `[automation-consumer] [mock] evaluate rules: user joined workspaceId=${payload.workspaceId}`,
        );
        break;
      default:
        this.logger.log(
          `[automation-consumer] [mock] evaluate rules for event '${event.eventType}'`,
        );
    }
  }
}

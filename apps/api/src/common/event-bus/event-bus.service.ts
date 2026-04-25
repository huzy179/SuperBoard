import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import type { DomainEvent } from '@superboard/shared';

const DOMAIN_EVENTS_QUEUE = 'domain-events';
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 1000;

@Injectable()
export class EventBusService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private queue: Queue | null = null;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('ENABLE_QUEUE') ?? false;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      this.logger.warn('EventBusService is disabled (ENABLE_QUEUE=false)');
      return;
    }

    const redisUrl = new URL(this.configService.getOrThrow<string>('REDIS_URL'));

    this.queue = new Queue(DOMAIN_EVENTS_QUEUE, {
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        username: redisUrl.username || undefined,
        password: redisUrl.password || undefined,
        db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
      },
      defaultJobOptions: {
        attempts: MAX_RETRIES,
        backoff: {
          type: 'exponential',
          delay: BACKOFF_BASE_MS,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    await this.queue.waitUntilReady();
    this.logger.log(`EventBusService ready — queue: "${DOMAIN_EVENTS_QUEUE}"`);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
    }
  }

  /**
   * Publish a domain event to the "domain-events" BullMQ queue.
   * Retries up to 3 times with exponential backoff on transient failures.
   * On final failure, logs the error with correlationId and event payload.
   */
  async publish(event: DomainEvent): Promise<void> {
    if (!this.enabled || !this.queue) {
      this.logger.debug(
        `[EventBus] Skipped publish (disabled): ${event.eventType} correlationId=${event.correlationId}`,
      );
      return;
    }

    let lastError: unknown;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        await this.queue.add(event.eventType, event, {
          jobId: event.idempotencyKey,
        });
        this.logger.debug(
          `[EventBus] Published: ${event.eventType} correlationId=${event.correlationId} attempt=${attempt}`,
        );
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `[EventBus] Publish attempt ${attempt}/${MAX_RETRIES} failed for ${event.eventType} correlationId=${event.correlationId}: ${(err as Error).message}`,
        );

        if (attempt < MAX_RETRIES) {
          await this.sleep(BACKOFF_BASE_MS * Math.pow(2, attempt - 1));
        }
      }
    }

    // All retries exhausted — log failure with full context
    this.logger.error(
      `[EventBus] Failed to publish event after ${MAX_RETRIES} attempts. ` +
        `eventType=${event.eventType} correlationId=${event.correlationId} ` +
        `idempotencyKey=${event.idempotencyKey} payload=${JSON.stringify(event.payload)}`,
      lastError instanceof Error ? lastError.stack : String(lastError),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

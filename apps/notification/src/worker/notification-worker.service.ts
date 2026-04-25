import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job, Queue } from 'bullmq';
import type { NotificationJobDTO } from '@superboard/shared';
import Redis from 'ioredis';
import { NotificationMetricsService } from '../metrics/notification-metrics.service';

const QUEUE_NAME = 'notifications';
const DLQ_NAME = 'notifications:failed';

@Injectable()
export class NotificationWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorkerService.name);
  private worker: Worker | null = null;
  private dlqQueue: Queue | null = null;
  private mainQueue: Queue | null = null;
  private redisClient: Redis | null = null;
  private maxAttempts: number = 5;
  private backlogInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: ConfigService,
    private metrics: NotificationMetricsService,
  ) {}

  async onModuleInit(): Promise<void> {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.maxAttempts = parseInt(this.config.get<string>('NOTIF_RETRY_MAX') ?? '5', 10);
    this.redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null });

    const parsed = new URL(redisUrl);
    const connection = {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
    };

    this.dlqQueue = new Queue(DLQ_NAME, { connection });
    this.mainQueue = new Queue(QUEUE_NAME, { connection });

    this.worker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        await this.processJob(job);
      },
      { connection, concurrency: 5 },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Job ${job.id} [${job.name}] completed`);
      const type = (job.data as NotificationJobDTO).type ?? 'unknown';
      this.metrics.recordSuccess(type);
    });

    this.worker.on('failed', async (job, err) => {
      if (!job) return;
      const type = (job.data as NotificationJobDTO).type ?? 'unknown';
      this.logger.error(
        `Job ${job.id} [${job.name}] failed (attempt ${job.attemptsMade}/${this.maxAttempts}): ${err.message}`,
      );
      this.metrics.recordFailure(type);

      if (job.attemptsMade >= this.maxAttempts) {
        this.logger.warn(`Job ${job.id} exhausted retries — moving to DLQ: ${DLQ_NAME}`);
        await this.dlqQueue?.add(job.name, {
          ...job.data,
          _dlqReason: err.message,
          _dlqAt: new Date().toISOString(),
          _originalJobId: job.id,
        });
      }
    });

    // Poll queue backlog every 30s
    this.backlogInterval = setInterval(async () => {
      try {
        const counts = await this.mainQueue?.getJobCounts('waiting', 'delayed');
        const backlog = (counts?.waiting ?? 0) + (counts?.delayed ?? 0);
        this.metrics.setQueueBacklog(backlog);
      } catch {
        // ignore
      }
    }, 30000);

    this.logger.log(
      `Notification worker started, listening on queue: ${QUEUE_NAME}, maxAttempts: ${this.maxAttempts}`,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.backlogInterval) clearInterval(this.backlogInterval);
    await this.worker?.close();
    await this.dlqQueue?.close();
    await this.mainQueue?.close();
    await this.redisClient?.quit();
  }

  private async processJob(job: Job): Promise<void> {
    const data = job.data as NotificationJobDTO;

    // Idempotency check: skip if already processed
    const idempotencyKey = `notif:processed:${data.id}`;
    const isNew = await this.redisClient?.set(idempotencyKey, '1', 'EX', 86400, 'NX');
    if (!isNew) {
      this.logger.log(`Job ${data.id} already processed — skipping (idempotency)`);
      return;
    }

    this.logger.log(
      `Processing notification job ${data.id} [${data.type}] for recipient ${data.recipientId}`,
      { correlationId: data.correlationId },
    );

    switch (data.type) {
      case 'in-app':
        await this.processInApp(data);
        break;
      case 'email':
        await this.processEmail(data);
        break;
      case 'digest':
        await this.processDigest(data);
        break;
      case 'reminder':
        await this.processReminder(data);
        break;
      default:
        this.logger.warn(`Unknown notification type: ${(data as NotificationJobDTO).type}`);
    }
  }

  private async processInApp(job: NotificationJobDTO): Promise<void> {
    this.logger.log(`[in-app] Delivering notification to user ${job.recipientId}`, {
      jobId: job.id,
      correlationId: job.correlationId,
    });
  }

  private async processEmail(job: NotificationJobDTO): Promise<void> {
    this.logger.log(`[email] Sending email to recipient ${job.recipientId}`, {
      jobId: job.id,
      correlationId: job.correlationId,
    });
  }

  private async processDigest(job: NotificationJobDTO): Promise<void> {
    this.logger.log(`[digest] Processing digest for recipient ${job.recipientId}`, {
      jobId: job.id,
      correlationId: job.correlationId,
      scheduledAt: job.scheduledAt,
    });
  }

  private async processReminder(job: NotificationJobDTO): Promise<void> {
    this.logger.log(`[reminder] Processing reminder for recipient ${job.recipientId}`, {
      jobId: job.id,
      correlationId: job.correlationId,
      scheduledAt: job.scheduledAt,
    });
  }
}

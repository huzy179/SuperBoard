import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue | null;
  private readonly queueName: string;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.queueName = this.configService.get<string>('QUEUE_NAME') || 'superboard-dev';
    this.enabled = this.configService.get<boolean>('ENABLE_QUEUE') ?? false;

    if (!this.enabled) {
      this.queue = null;
      return;
    }

    const redisUrl = new URL(this.configService.getOrThrow<string>('REDIS_URL'));

    this.queue = new Queue(this.queueName, {
      connection: {
        host: redisUrl.hostname,
        port: Number(redisUrl.port || 6379),
        username: redisUrl.username || undefined,
        password: redisUrl.password || undefined,
        db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled || !this.queue) {
      return;
    }

    await this.queue.waitUntilReady();
    await this.scheduleAutonomousJobs();
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled || !this.queue) {
      return;
    }

    await this.queue.close();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async isHealthy(): Promise<{ queueName: string; jobCounts: Record<string, number> }> {
    if (!this.enabled || !this.queue) {
      return {
        queueName: this.queueName,
        jobCounts: {},
      };
    }

    const jobCounts = await this.queue.getJobCounts(
      'active',
      'completed',
      'delayed',
      'failed',
      'waiting',
    );

    return {
      queueName: this.queueName,
      jobCounts,
    };
  }

  async addJob(
    name: string,
    data: Record<string, unknown>,
    opts?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.enabled || !this.queue) {
      return;
    }

    await this.queue.add(name, data, opts);
  }

  async scheduleAutonomousJobs(): Promise<void> {
    if (!this.enabled || !this.queue) {
      return;
    }

    // 1. Neural Daily Briefing (06:00 AM every day)
    await this.queue.add(
      'NEURAL_DAILY',
      {},
      {
        repeat: { pattern: '0 6 * * *' },
        jobId: 'neural_daily_scheduled',
      },
    );

    // 2. Autonomous Health Audit (Every 24 hours - 00:00 AM)
    await this.queue.add(
      'AUDITOR_HEAL',
      {},
      {
        repeat: { pattern: '0 0 * * *' },
        jobId: 'auditor_heal_scheduled',
      },
    );

    console.log('[QueueService] Autonomous Jobs registered successfully.');
  }
}

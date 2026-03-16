import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;
  private readonly queueName: string;

  constructor(private readonly configService: ConfigService) {
    this.queueName = this.configService.get<string>('QUEUE_NAME') || 'superboard-dev';

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
    await this.queue.waitUntilReady();
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }

  async isHealthy(): Promise<{ queueName: string; jobCounts: Record<string, number> }> {
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
}

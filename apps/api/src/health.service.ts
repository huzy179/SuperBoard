import { Injectable } from '@nestjs/common';
import type { ApiResponse } from '@superboard/shared';
import { logger } from './common/logger';
import { QueueService } from './common/queue.service';
import { RedisService } from './common/redis.service';
import { PrismaService } from './prisma/prisma.service';

interface DependencyHealth {
  status: 'up' | 'down';
  details?: Record<string, unknown>;
  error?: string;
}

interface HealthPayload {
  status: 'ok' | 'degraded';
  dependencies: {
    db: DependencyHealth;
    redis: DependencyHealth;
    queue: DependencyHealth;
  };
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
  ) {}

  async getHealth(): Promise<ApiResponse<HealthPayload>> {
    const [db, redis, queue] = await Promise.all([
      this.checkDb(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const status = [db, redis, queue].every((dependency) => dependency.status === 'up')
      ? 'ok'
      : 'degraded';

    const response: ApiResponse<HealthPayload> = {
      success: status === 'ok',
      data: {
        status,
        dependencies: {
          db,
          redis,
          queue,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    logger.info({ health: response.data }, 'health.checked');

    return response;
  }

  private async checkDb(): Promise<DependencyHealth> {
    try {
      await this.prismaService.isHealthy();
      return { status: 'up' };
    } catch (error) {
      return { status: 'down', error: this.getErrorMessage(error) };
    }
  }

  private async checkRedis(): Promise<DependencyHealth> {
    if (!this.redisService.isEnabled()) {
      return { status: 'up', details: { enabled: false } };
    }

    try {
      const ping = await this.redisService.ping();
      return { status: ping === 'PONG' ? 'up' : 'down', details: { ping } };
    } catch (error) {
      return { status: 'down', error: this.getErrorMessage(error) };
    }
  }

  private async checkQueue(): Promise<DependencyHealth> {
    if (!this.queueService.isEnabled()) {
      return { status: 'up', details: { enabled: false } };
    }

    try {
      const details = await this.queueService.isHealthy();
      return { status: 'up', details };
    } catch (error) {
      return { status: 'down', error: this.getErrorMessage(error) };
    }
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }
}

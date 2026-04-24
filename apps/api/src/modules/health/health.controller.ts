import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { DependencyHealthDTO, HealthDataDTO } from '@superboard/shared';
import { Public } from '../../common/decorators/public.decorator';
import { HealthService } from './health.service';
import { RedisService } from '../../common/redis.service';
import { QueueService } from '../../common/queue.service';

@Controller()
export class HealthCheckController {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly healthService: HealthService,
    private readonly redisService: RedisService,
    private readonly queueService: QueueService,
  ) {}

  @Public()
  @Get('health')
  liveness(): HealthDataDTO {
    return {
      status: 'ok',
      service: 'core-api',
      version: this.configService.get<string>('npm_package_version') ?? '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies: [],
    };
  }

  @Public()
  @Get('ready')
  async readiness(@Res() res: Response): Promise<void> {
    const [postgres, redis, queue] = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkQueue(),
    ]);

    const dependencies: DependencyHealthDTO[] = [postgres, redis, queue];
    const allHealthy = dependencies.every((d) => d.status === 'healthy');

    const body: HealthDataDTO = {
      status: allHealthy ? 'ok' : 'not_ready',
      service: 'core-api',
      version: this.configService.get<string>('npm_package_version') ?? '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies,
    };

    res.status(allHealthy ? 200 : 503).json(body);
  }

  private async checkPostgres(): Promise<DependencyHealthDTO> {
    const start = Date.now();
    try {
      await this.healthService.checkDatabase();
      return {
        name: 'postgres',
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'postgres',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<DependencyHealthDTO> {
    const start = Date.now();
    try {
      const pong = await this.redisService.ping();
      return {
        name: 'redis',
        status: pong === 'PONG' || pong === 'DISABLED' ? 'healthy' : 'unhealthy',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'redis',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkQueue(): Promise<DependencyHealthDTO> {
    const start = Date.now();
    try {
      await this.queueService.isHealthy();
      return {
        name: 'bullmq',
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        name: 'bullmq',
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

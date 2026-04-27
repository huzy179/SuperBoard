import { Controller, Get, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import type { DependencyHealthDTO, HealthDataDTO } from '@superboard/shared';
import { HealthCheckService } from '@superboard/backend-shared/health';
import { Public } from '../../common/decorators/public.decorator';

@Controller()
export class HealthCheckController {
  private readonly startTime = Date.now();

  constructor(
    private readonly configService: ConfigService,
    private readonly healthCheckService: HealthCheckService,
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
    const readiness = await this.healthCheckService.checkReadiness();
    const dependencies: DependencyHealthDTO[] = readiness.dependencies.map((d) => ({
      name: d.name,
      status: d.status,
      latencyMs: d.latencyMs,
      error: d.error,
    }));
    const allHealthy = readiness.dependencies.every((d) => d.status === 'healthy');

    const body: HealthDataDTO = {
      status: allHealthy ? 'ok' : 'not_ready',
      service: 'core-api',
      version: this.configService.get<string>('npm_package_version') ?? '0.1.0',
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      dependencies,
    };

    res.status(allHealthy ? 200 : 503).json(body);
  }
}

import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { HealthCheckService } from './health-check.service';

@Controller()
export class HealthCheckController {
  constructor(private readonly health: HealthCheckService) {}

  @Get('health')
  liveness() {
    return this.health.checkHealth();
  }

  @Get('ready')
  async readiness(@Res() res: Response): Promise<void> {
    const result = await this.health.checkReadiness();
    const allHealthy = result.dependencies.every((d) => d.status === 'healthy');
    res.status(allHealthy ? 200 : 503).json(result);
  }
}

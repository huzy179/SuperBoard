import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  liveness() {
    return {
      status: 'ok',
      service: 'collaboration',
      version: process.env.npm_package_version ?? '0.1.0',
      uptime: process.uptime(),
    };
  }

  @Get('ready')
  readiness() {
    return {
      status: 'ready',
      dependencies: [],
    };
  }
}

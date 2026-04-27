import type { HealthIndicator, HealthStatus } from '@superboard/backend-shared/health';
import { PrismaService } from '../../../prisma/prisma.service';

export class PrismaHealthIndicator implements HealthIndicator {
  name: string;

  constructor(
    name: string,
    private readonly prisma: PrismaService,
  ) {
    this.name = name;
  }

  async check(): Promise<HealthStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', latencyMs: Date.now() - start };
    } catch (error) {
      return {
        status: 'unhealthy',
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

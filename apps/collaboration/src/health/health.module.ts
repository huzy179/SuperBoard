import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  HealthCheckController,
  HealthCheckService,
  RedisHealthIndicator,
} from '@superboard/backend-shared/health';
import { RedisPoolManager } from '@superboard/backend-shared/connections';

@Module({
  controllers: [HealthCheckController],
  providers: [
    RedisPoolManager,
    {
      provide: HealthCheckService,
      useFactory: (config: ConfigService, redisPool: RedisPoolManager) => {
        const health = new HealthCheckService({
          service: 'collaboration',
          version: config.get<string>('npm_package_version') ?? '0.1.0',
        });

        const redisUrl = config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
        const parsed = new URL(redisUrl);
        const host = parsed.hostname;
        const port = Number(parsed.port || 6379);
        const password = parsed.password || undefined;
        const db =
          parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0;

        health.registerIndicator(
          new RedisHealthIndicator('redis', redisPool, {
            host,
            port,
            password,
            db: Number.isFinite(db) ? db : 0,
            maxRetriesPerRequest: 1,
          }),
        );

        return health;
      },
      inject: [ConfigService, RedisPoolManager],
    },
  ],
})
export class HealthModule {}

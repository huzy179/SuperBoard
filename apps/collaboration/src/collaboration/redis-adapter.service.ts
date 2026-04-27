import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPoolManager } from '@superboard/backend-shared/connections';
import Redis from 'ioredis';

@Injectable()
export class RedisAdapterService implements OnModuleInit, OnModuleDestroy {
  pubClient!: Redis;
  subClient!: Redis;

  constructor(
    private config: ConfigService,
    private redisPool: RedisPoolManager,
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsed = new URL(redisUrl);
    const host = parsed.hostname;
    const port = Number(parsed.port || 6379);
    const password = parsed.password || undefined;
    const db = parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0;

    this.pubClient = await this.redisPool.getConnection({
      host,
      port,
      password,
      db: Number.isFinite(db) ? db : 0,
      maxRetriesPerRequest: null,
    });

    // socket.io redis adapter expects separate pub/sub clients; reuse config via duplicate()
    this.subClient = this.pubClient.duplicate();
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error('Redis duplicate connection timeout')),
        5000,
      );
      this.subClient.on('ready', () => {
        clearTimeout(timeout);
        resolve();
      });
      this.subClient.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  }

  async onModuleDestroy() {
    await this.subClient?.quit().catch(() => {});
    await this.redisPool.closeAll();
  }
}

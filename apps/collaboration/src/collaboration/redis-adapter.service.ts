import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisAdapterService implements OnModuleInit, OnModuleDestroy {
  pubClient!: Redis;
  subClient!: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    this.pubClient = new Redis(redisUrl);
    this.subClient = new Redis(redisUrl);
  }

  async onModuleDestroy() {
    await this.pubClient.quit();
    await this.subClient.quit();
  }
}

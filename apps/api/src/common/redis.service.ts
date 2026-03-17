import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly client: RedisClientType;
  private readonly enabled: boolean;

  constructor(private readonly configService: ConfigService) {
    this.enabled = this.configService.get<boolean>('ENABLE_REDIS') ?? false;
    this.client = createClient({
      url: this.configService.getOrThrow<string>('REDIS_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async ping(): Promise<string> {
    if (!this.enabled) {
      return 'DISABLED';
    }

    return this.client.ping();
  }

  getClient(): RedisClientType {
    return this.client;
  }
}

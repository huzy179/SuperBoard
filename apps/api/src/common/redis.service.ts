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

  async getJson<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value as string) as T;
    } catch (err) {
      console.error(`[RedisService] Failed to get key ${key}:`, err);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    if (!this.enabled) return;
    try {
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.set(key, stringValue, { EX: ttlSeconds });
      } else {
        await this.client.set(key, stringValue);
      }
    } catch (err) {
      console.error(`[RedisService] Failed to set key ${key}:`, err);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled) return;
    try {
      await this.client.del(key);
    } catch (err) {
      console.error(`[RedisService] Failed to delete key ${key}:`, err);
    }
  }
}

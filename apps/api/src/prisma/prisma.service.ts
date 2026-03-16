import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    this.pool = new Pool({
      connectionString: this.configService.getOrThrow<string>('DATABASE_URL'),
    });
  }

  async onModuleInit(): Promise<void> {
    const client = await this.pool.connect();
    client.release();
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async isHealthy(): Promise<boolean> {
    await this.pool.query('SELECT 1');
    return true;
  }
}

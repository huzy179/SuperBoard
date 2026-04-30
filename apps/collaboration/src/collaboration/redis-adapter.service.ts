import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPoolManager, DatabasePoolManager } from '@superboard/backend-shared/connections';
import Redis from 'ioredis';

@Injectable()
export class RedisAdapterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisAdapterService.name);
  pubClient!: Redis;
  subClient!: Redis;

  constructor(
    private config: ConfigService,
    private redisPool: RedisPoolManager,
    private dbPool: DatabasePoolManager,
  ) {
    const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
    try {
      const parsed = new URL(redisUrl);
      const host = parsed.hostname || 'localhost';
      const port = Number(parsed.port || 6379);
      const password = parsed.password || undefined;
      const db = parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0;

      const redisOptions = {
        host,
        port,
        password,
        db: Number.isFinite(db) ? db : 0,
        maxRetriesPerRequest: null,
      };

      this.pubClient = new Redis(redisOptions);
      this.subClient = new Redis(redisOptions);
      this.logger.log(`Redis clients initialized in constructor: ${host}:${port}/${db}`);
    } catch (e) {
      this.logger.error('Failed to parse REDIS_URL in constructor', e);
      // Fallback
      this.pubClient = new Redis();
      this.subClient = new Redis();
    }
  }

  async onModuleInit() {
    // Clients are already initialized in constructor.
    // We can still await subClient ready if needed, but not required for the adapter instance.

    // Initialize database pool if configured
    const dbUrl = this.config.get<string>('DATABASE_URL');
    if (dbUrl) {
      const dbParsed = new URL(dbUrl);
      await this.dbPool.getPool({
        host: dbParsed.hostname || 'localhost',
        port: Number(dbParsed.port || 5432),
        database: dbParsed.pathname?.slice(1) || 'collaboration',
        username: dbParsed.username || 'postgres',
        password: dbParsed.password || '',
        ssl: dbParsed.searchParams.get('ssl') === 'true',
        max: 20,
      });

      this.logger.log(
        `Database connection pool established: ${dbParsed.hostname}:${dbParsed.port}/${dbParsed.pathname?.slice(1) || 'collaboration'}`,
      );
    }
  }

  async onModuleDestroy() {
    this.logger.log('Closing Redis and database connections');
    await this.subClient?.quit().catch((err) => {
      this.logger.warn(`Error closing Redis sub client: ${err.message}`);
    });
    await this.redisPool.closeAll();
    await this.dbPool.closeAll();
    this.logger.log('All connections closed');
  }
}

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
  ) {}

  async onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const parsed = new URL(redisUrl);
    const host = parsed.hostname;
    const port = Number(parsed.port || 6379);
    const password = parsed.password || undefined;
    const db = parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0;

    // Get connection from shared RedisPoolManager with health checking
    this.pubClient = await this.redisPool.getConnection({
      host: host || 'localhost',
      port,
      password,
      db: Number.isFinite(db) ? db : 0,
      maxRetriesPerRequest: null,
    });

    this.logger.log(
      `Redis connection established: ${host}:${port}/${Number.isFinite(db) ? db : 0}`,
    );

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

    this.logger.log('Redis pub/sub clients initialized');

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

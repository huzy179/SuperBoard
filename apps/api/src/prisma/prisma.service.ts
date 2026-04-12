import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { logger } from '../common/logger';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    super({ adapter });

    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ operation, model, args, query }) {
            const start = Date.now();
            const result = await query(args);
            const duration = Date.now() - start;

            if (duration > 100) {
              logger.warn(
                {
                  type: 'DB_QUERY',
                  model,
                  operation,
                  duration: `${duration}ms`,
                  slow: true,
                },
                `🐢 SLOW QUERY: ${model}.${operation} took ${duration}ms`,
              );
            }

            return result;
          },
        },
      },
    }) as unknown as this;
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async isHealthy(): Promise<boolean> {
    await this.$queryRaw`SELECT 1`;
    return true;
  }
}

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
            // Global Soft-Delete Filter
            const softDeleteModels = [
              'Workspace',
              'User',
              'WorkspaceMember',
              'Project',
              'Task',
              'TaskEvent',
              'Comment',
              'Attachment',
              'Notification',
              'Label',
              'AuditLog',
              'Channel',
              'Message',
              'Doc',
            ];

            if (
              model &&
              softDeleteModels.includes(model) &&
              [
                'findMany',
                'findFirst',
                'findUnique',
                'findUniqueOrThrow',
                'count',
                'aggregate',
              ].includes(operation)
            ) {
              const whereParams = (args as { where?: Record<string, unknown> }).where || {};
              // Only inject if not explicitly searching for deleted items
              if (whereParams.deletedAt === undefined) {
                (args as { where: Record<string, unknown> }).where = {
                  ...whereParams,
                  deletedAt: null,
                };
              }
            }

            const start = Date.now();
            try {
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
            } catch (error) {
              const duration = Date.now() - start;
              logger.error(
                {
                  type: 'DB_ERROR',
                  model,
                  operation,
                  duration: `${duration}ms`,
                  error: error instanceof Error ? error.message : String(error),
                },
                `❌ DB ERROR: ${model}.${operation} failed after ${duration}ms`,
              );
              throw error;
            }
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

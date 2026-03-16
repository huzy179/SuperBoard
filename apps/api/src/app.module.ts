import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env';
import { HealthService } from './health.service';
import { QueueService } from './common/queue.service';
import { RedisService } from './common/redis.service';
import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService, PrismaService, RedisService, QueueService],
})
export class AppModule {}

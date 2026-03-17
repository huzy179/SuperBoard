import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env';
import { HealthService } from './health.service';
import { QueueService } from './common/queue.service';
import { RedisService } from './common/redis.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [HealthService, PrismaService, RedisService, QueueService],
})
export class AppModule {}

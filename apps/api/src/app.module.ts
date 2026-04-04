import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BearerAuthGuard } from './common/guards/bearer-auth.guard';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env';
import { HealthService } from './health.service';
import { QueueService } from './common/queue.service';
import { RedisService } from './common/redis.service';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProjectModule } from './modules/project/project.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TaskModule } from './modules/task/task.module';
import { WorkflowModule } from './modules/workflow/workflow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    AuthModule,
    ProjectModule,
    WorkspaceModule,
    TaskModule,
    NotificationModule,
    WorkflowModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    PrismaService,
    RedisService,
    QueueService,
    {
      provide: APP_GUARD,
      useClass: BearerAuthGuard,
    },
  ],
})
export class AppModule {}

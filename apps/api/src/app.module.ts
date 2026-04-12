import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BearerAuthGuard } from './common/guards/bearer-auth.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env';
import { HealthService } from './health.service';
import { QueueService } from './common/queue.service';
import { RedisService } from './common/redis.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { ProjectModule } from './modules/project/project.module';
import { WorkspaceModule } from './modules/workspace/workspace.module';
import { TaskModule } from './modules/task/task.module';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { UploadModule } from './modules/upload/upload.module';
import { SearchModule } from './modules/search/search.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AiModule } from './modules/ai/ai.module';
import { AuditModule } from './modules/audit/audit.module';
import { ChatModule } from './modules/chat/chat.module';
import { DocModule } from './modules/doc/doc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    ProjectModule,
    WorkspaceModule,
    TaskModule,
    NotificationModule,
    WorkflowModule,
    UploadModule,
    SearchModule,
    PrismaModule,
    MonitoringModule,
    AiModule,
    AuditModule,
    ChatModule,
    DocModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    RedisService,
    QueueService,
    {
      provide: APP_GUARD,
      useClass: BearerAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
  ],
})
export class AppModule {}

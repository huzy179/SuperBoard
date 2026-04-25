import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { BearerAuthGuard } from './common/guards/bearer-auth.guard';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { HealthController } from './health.controller';
import { validateEnv } from './config/env';
import { HealthService } from './health.service';
import { HealthModule } from './modules/health/health.module';
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
import { AutomationModule } from './modules/automation/automation.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { CommonModule } from './common/common.module';
import { WorkerModule } from './common/worker.module';
import { EventBusModule } from './common/event-bus/event-bus.module';

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
    CommonModule,
    WorkerModule,
    EventBusModule,
    HealthModule,
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
    AutomationModule,
    KnowledgeModule,
    AnalyticsModule,
  ],
  controllers: [HealthController],
  providers: [
    HealthService,
    {
      provide: APP_GUARD,
      useClass: BearerAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}

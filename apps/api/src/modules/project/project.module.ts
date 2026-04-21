import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectEventsModule } from '../project-events/project-events.module';
import { DocService } from '../doc/doc.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { AiModule } from '../ai/ai.module';
import { AutomationModule } from '../automation/automation.module';
import { DocModule } from '../doc/doc.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    WorkflowModule,
    AiModule,
    AutomationModule,
    DocModule,
    AnalyticsModule,
    TaskModule,
    ProjectEventsModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, DocService],
  exports: [ProjectService],
})
export class ProjectModule {}

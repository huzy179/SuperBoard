import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectGateway } from './project.gateway';
import { MentionService } from './mention.service';
import { DocService } from '../doc/doc.service';
import { WorkflowModule } from '../workflow/workflow.module';
import { AiModule } from '../ai/ai.module';
import { AutomationModule } from '../automation/automation.module';
import { DocModule } from '../doc/doc.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    WorkflowModule,
    AiModule,
    AutomationModule,
    DocModule,
    AnalyticsModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService, CommentService, ProjectGateway, MentionService, DocService],
  exports: [ProjectService, ProjectGateway],
})
export class ProjectModule {}

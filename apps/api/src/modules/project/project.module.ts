import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectGateway } from './project.gateway';
import { MentionService } from './mention.service';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';

import { WorkflowModule } from '../workflow/workflow.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AuthModule, NotificationModule, WorkflowModule, AiModule],
  controllers: [ProjectController, ReportController],
  providers: [ProjectService, CommentService, ProjectGateway, MentionService, ReportService],
  exports: [ProjectService],
})
export class ProjectModule {}

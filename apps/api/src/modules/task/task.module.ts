import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CommentService } from './comment.service';
import { MentionService } from './mention.service';
import { ProjectEventsModule } from '../project-events/project-events.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    AuthModule,
    WorkflowModule,
    NotificationModule,
    forwardRef(() => AiModule),
    AutomationModule,
    ProjectEventsModule,
  ],
  controllers: [TaskController],
  providers: [TaskService, CommentService, MentionService],
  exports: [TaskService, CommentService, MentionService],
})
export class TaskModule {}

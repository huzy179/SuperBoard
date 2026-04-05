import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectGateway } from './project.gateway';

import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, NotificationModule, WorkflowModule],
  controllers: [ProjectController],
  providers: [ProjectService, CommentService, ProjectGateway],
  exports: [ProjectService],
})
export class ProjectModule {}

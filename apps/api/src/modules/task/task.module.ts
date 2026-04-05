import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

import { WorkflowModule } from '../workflow/workflow.module';

@Module({
  imports: [AuthModule, WorkflowModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}

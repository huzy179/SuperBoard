import { Controller, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { requireWorkspace } from '../../common/helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Patch(':taskId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    const workspaceId = requireWorkspace(user);

    await this.taskService.archiveTaskForWorkspace({
      taskId,
      workspaceId,
    });

    return apiSuccess({ archived: true });
  }

  @Patch(':taskId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    const workspaceId = requireWorkspace(user);

    await this.taskService.restoreTaskForWorkspace({
      taskId,
      workspaceId,
    });

    return apiSuccess({ archived: false });
  }

  @Post(':taskId/ai/decompose')
  @HttpCode(HttpStatus.OK)
  async decomposeTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    requireWorkspace(user);
    const subtasks = await this.taskService.generateAiSubtasks(taskId);
    return apiSuccess({ subtasks });
  }

  @Post(':taskId/ai/refine')
  @HttpCode(HttpStatus.OK)
  async refineTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    requireWorkspace(user);
    const metadata = await this.taskService.refineTaskMetadata(taskId);
    return apiSuccess(metadata);
  }
}

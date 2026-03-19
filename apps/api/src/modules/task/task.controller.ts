import {
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TaskService } from './task.service';

@Controller('tasks')
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Patch(':taskId/archive')
  @HttpCode(HttpStatus.OK)
  async archiveTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    if (!user.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    await this.taskService.archiveTaskForWorkspace({
      taskId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess({ archived: true });
  }

  @Patch(':taskId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    if (!user.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    await this.taskService.restoreTaskForWorkspace({
      taskId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess({ archived: false });
  }
}

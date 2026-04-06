import { Controller, Post, Param, NotFoundException } from '@nestjs/common';
import { AiService } from './ai.service';
import { TaskService } from '../task/task.service';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserDTO } from '@superboard/shared';

@Controller('tasks')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly taskService: TaskService,
  ) {}

  @Post(':taskId/summarize')
  async summarizeTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    const task = await this.taskService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const summary = await this.aiService.summarizeTask(task.id, task.title, task.description || '');

    return apiSuccess({ summary });
  }
}

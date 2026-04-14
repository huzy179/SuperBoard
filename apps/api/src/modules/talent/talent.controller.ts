import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { TalentService } from './talent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserDTO } from '@superboard/shared';

@Controller('v1/talent')
@UseGuards(JwtAuthGuard)
export class TalentController {
  constructor(private talentService: TalentService) {}

  @Post('sync')
  async syncSkills(@CurrentUser() user: AuthUserDTO) {
    const result = await this.talentService.syncUserSkills(user.id);
    return apiSuccess({ profile: result });
  }

  @Get('tasks/:taskId/suggestions')
  async suggestAssignees(
    @Param('taskId') taskId: string,
    @Query('workspaceId') workspaceId: string,
  ) {
    const suggestions = await this.talentService.suggestAssignees(taskId, workspaceId);
    return apiSuccess({ suggestions });
  }
}

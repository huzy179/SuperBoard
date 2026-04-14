import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { GraphService } from './graph.service';
import { DiaryService } from './diary.service';
import { DiagnosisService } from './diagnosis.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { requireWorkspace } from '../../common/helpers';

@Controller('v1/knowledge')
@UseGuards(JwtAuthGuard)
export class KnowledgeController {
  constructor(
    private graphService: GraphService,
    private diaryService: DiaryService,
    private diagnosisService: DiagnosisService,
  ) {}

  @Get('graph/:projectId')
  async getProjectGraph(@Param('projectId') projectId: string) {
    const data = await this.graphService.getProjectGraph(projectId);
    return apiSuccess(data);
  }

  @Get('atlas')
  async getGlobalVectorAtlas(@CurrentUser() user: AuthUserDTO) {
    const workspaceId = requireWorkspace(user);
    const data = await this.graphService.getGlobalVectorAtlas(workspaceId);
    return apiSuccess(data);
  }

  @Get('silo-check')
  async diagnoseKnowledgeSilos(@CurrentUser() user: AuthUserDTO) {
    const workspaceId = requireWorkspace(user);
    const data = await this.diagnosisService.diagnoseKnowledgeSilos(workspaceId);
    return apiSuccess(data);
  }

  @Get('strategic-divergence')
  async detectStrategicDivergence(@CurrentUser() user: AuthUserDTO) {
    const workspaceId = requireWorkspace(user);
    const data = await this.diagnosisService.detectStrategicDivergence(workspaceId);
    return apiSuccess(data);
  }

  @Post('autolink/:docId')
  async suggestLinks(@Param('docId') docId: string) {
    const suggestions = await this.graphService.suggestLinks(docId);
    return apiSuccess({ suggestions });
  }

  @Post('diary/:projectId')
  async generateDiary(@Param('projectId') projectId: string, @CurrentUser() user: AuthUserDTO) {
    const diary = await this.diaryService.generateWeeklyDiary(projectId, user.id);
    return apiSuccess(diary);
  }
}

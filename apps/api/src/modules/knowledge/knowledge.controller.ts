import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { GraphService } from './graph.service';
import { DiaryService } from './diary.service';
import { DiagnosisService } from './diagnosis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response.helper';

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
    const data = await this.graphService.getGlobalVectorAtlas(user.workspaceId);
    return apiSuccess(data);
  }

  @Get('diagnosis')
  async getStrategicDiagnosis(@CurrentUser() user: AuthUserDTO) {
    const data = await this.diagnosisService.diagnoseKnowledgeSilos(user.workspaceId);
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

import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReportService } from './report.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response.helper';

@Controller('v1/executive')
@UseGuards(JwtAuthGuard)
export class ExecutiveController {
  constructor(private reportService: ReportService) {}

  @Get('projects/:projectId/briefing')
  async getProjectBriefing(@Param('projectId') projectId: string) {
    const data = await this.reportService.getStrategicHealth(projectId);
    return apiSuccess(data);
  }
}

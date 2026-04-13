import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
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

  @Get('daily-briefing')
  async getDailyBriefing(@Query('workspaceId') workspaceId: string) {
    const briefing = await this.reportService.getNeuralDailyBriefing(workspaceId);
    return apiSuccess(briefing);
  }

  @Get('adaptive-layout')
  async getAdaptiveLayout(@Query('workspaceId') workspaceId: string) {
    const layout = await this.reportService.getAdaptiveLayout(workspaceId);
    return apiSuccess(layout);
  }

  @Get('navigation-focus')
  async getNavigationFocus(@Query('workspaceId') workspaceId: string) {
    const focus = await this.reportService.getNavigationFocus(workspaceId);
    return apiSuccess(focus);
  }

  @Post('projects/:projectId/simulate')
  async simulateProjectTrajectory(
    @Param('projectId') projectId: string,
    @Body()
    adjustments: {
      velocityBoost?: number;
      excludedTaskIds?: string[];
      priorityShiftIds?: string[];
    },
  ) {
    const forecast = await this.reportService.getVelocityForecasting(projectId, adjustments);
    return apiSuccess({ forecast });
  }

  @Post('projects/:projectId/memoir')
  async generateMemoir(@Param('projectId') projectId: string, @Body('persona') persona: string) {
    const memoir = await this.reportService.generateProjectMemoir(projectId, persona);
    return apiSuccess(memoir);
  }

  @Get('projects/:projectId/memoirs')
  async getMemoirs(@Param('projectId') projectId: string) {
    const memoirs = await this.reportService.getProjectMemoirs(projectId);
    return apiSuccess(memoirs);
  }
}

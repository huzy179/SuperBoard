import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { requireWorkspace } from '../../common/helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ChronologyService } from './chronology.service';
import { CommandService } from './command.service';
import { ForecastService } from './forecast.service';
import { SimulationService } from './simulation.service';
import { BriefingService } from './briefing.service';

@Controller('projects')
export class AnalyticsController {
  constructor(
    private chronologyService: ChronologyService,
    private commandService: CommandService,
    private forecastService: ForecastService,
    private simulationService: SimulationService,
    private briefingService: BriefingService,
  ) {}

  @Post(':projectId/simulate')
  async runSimulation(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body()
    params: { velocityMultiplier: number; addedPoints: number; driftIntensityModifier: number },
  ) {
    requireWorkspace(user);
    const data = await this.simulationService.runMissionSimulation(projectId, params);
    return apiSuccess(data);
  }

  @Get(':projectId/forecast')
  async getMissionForecast(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    requireWorkspace(user);
    const data = await this.forecastService.getMissionForecast(projectId);
    return apiSuccess(data);
  }

  @Get(':projectId/briefing')
  async getMissionBriefing(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    requireWorkspace(user);
    const data = await this.commandService.getMissionBriefing(projectId);
    return apiSuccess(data);
  }

  @Get(':projectId/chronology')
  async getProjectChronology(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    requireWorkspace(user);
    const timeline = await this.chronologyService.getProjectTimeline(projectId);
    return apiSuccess(timeline);
  }

  @Post(':projectId/generate-briefing')
  async generateBriefing(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: { goal: string; tasks: unknown[] },
  ) {
    requireWorkspace(user);
    const result = await this.briefingService.generateMissionBriefing(
      projectId,
      body.goal,
      body.tasks,
    );
    return apiSuccess(result);
  }
}

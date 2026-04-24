import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { NeuralAgentService } from './neural-agent.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response';

@Controller('v1/automation/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private neuralAgentService: NeuralAgentService) {}

  @Get('logs')
  async getAgentLogs(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    const logs = await this.neuralAgentService.getAgentLogs(workspaceId, projectId);
    return apiSuccess({ logs });
  }
}

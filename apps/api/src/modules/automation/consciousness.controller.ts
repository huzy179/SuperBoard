import { Controller, Get, Query } from '@nestjs/common';
import { NeuralAgentService } from './neural-agent.service';
import { apiSuccess } from '../../common/api-response';

@Controller('v1/automation/consciousness')
export class ConsciousnessController {
  constructor(private neuralAgentService: NeuralAgentService) {}

  @Get('stream')
  async getConsciousnessStream(@Query('workspaceId') workspaceId: string) {
    const pulses = await this.neuralAgentService.getSingularityStream(workspaceId);
    return apiSuccess(pulses);
  }
}

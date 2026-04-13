import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { apiSuccess } from '../../common/api-response';

@Controller('v1/automation/consciousness')
export class ConsciousnessController {
  constructor(private prisma: PrismaService) {}

  @Get('stream')
  async getConsciousnessStream(@Query('workspaceId') workspaceId: string) {
    const pulses = await this.prisma.agentAction.findMany({
      where: {
        workspaceId,
        agentName: 'NeuralSingularity',
        actionType: 'CONSCIOUSNESS_PULSE',
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return apiSuccess(pulses);
  }
}

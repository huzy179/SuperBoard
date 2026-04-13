import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response.helper';

@Controller('v1/automation/agents')
@UseGuards(JwtAuthGuard)
export class AgentController {
  constructor(private prisma: PrismaService) {}

  @Get('logs')
  async getAgentLogs(
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    const logs = await this.prisma.agentAction.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return apiSuccess({ logs });
  }
}

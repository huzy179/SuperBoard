import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { apiSuccess } from '../../common/api-response';
import type { AuthUserDTO, CreateWorkflowRuleDTO, UpdateWorkflowRuleDTO } from '@superboard/shared';

import { AutomationService } from './automation.service';
import { NeuralAgentService } from './neural-agent.service';
import { SingularityService } from './singularity.service';
import { SymbiosisService } from './symbiosis.service';

@Controller('v1/automation')
export class AutomationController {
  constructor(
    private prisma: PrismaService,
    private automationService: AutomationService,
    private neuralAgentService: NeuralAgentService,
    private singularityService: SingularityService,
    private symbiosisService: SymbiosisService,
    private executiveService: ExecutiveService,
  ) {}

  @Get('executive/directive')
  async getDirective(@Query('workspaceId') workspaceId: string) {
    const data = await this.executiveService.generateGlobalDirective(workspaceId);
    return apiSuccess(data);
  }

  @Post('executive/directive/:id/execute')
  async executeDirective(@Param('id') id: string) {
    const data = await this.executiveService.executeDirective(id);
    return apiSuccess(data);
  }

  @Get('proposals')
  async getProposals(@Query('workspaceId') workspaceId: string) {
    const data = await this.symbiosisService.getPendingProposals(workspaceId);
    return apiSuccess(data);
  }

  @Post('proposals/:id/approve')
  async approveProposal(@Param('id') id: string) {
    const data = await this.symbiosisService.approveProposal(id);
    return apiSuccess(data);
  }

  @Post('pulse')
  async triggerPulse(@Query('workspaceId') workspaceId: string) {
    const result = await this.singularityService.pulseConsciousness(workspaceId);
    return apiSuccess(result);
  }

  @Get('health')
  async getHealth(@Query('workspaceId') workspaceId: string) {
    const actions = await this.prisma.agentAction.findMany({
      where: { workspaceId, agentName: 'AuditorAgent' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return apiSuccess({ actions });
  }

  @Post('heal')
  async triggerHeal(@Query('workspaceId') workspaceId: string) {
    const result = await this.neuralAgentService.runAuditorAgent(workspaceId);
    return apiSuccess(result);
  }

  @Post('generate-rule')
  async generateRule(@CurrentUser() user: AuthUserDTO, @Body('prompt') prompt: string) {
    if (!prompt) return apiSuccess(null);
    const rule = await this.automationService.generateRuleFromPrompt(prompt);
    return apiSuccess(rule);
  }

  @Get('rules')
  async getRules(
    @CurrentUser() user: AuthUserDTO,
    @Query('workspaceId') workspaceId: string,
    @Query('projectId') projectId?: string,
  ) {
    const rules = await this.prisma.workflowRule.findMany({
      where: {
        workspaceId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess(rules);
  }

  @Post('rules')
  async createRule(
    @CurrentUser() user: AuthUserDTO,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkflowRuleDTO,
  ) {
    const rule = await this.prisma.workflowRule.create({
      data: {
        workspaceId,
        projectId: dto.projectId || null,
        name: dto.name,
        description: dto.description || null,
        trigger: dto.trigger as unknown as Record<string, unknown>,
        actions: dto.actions as unknown as Record<string, unknown>[],
      },
    });
    return apiSuccess(rule);
  }

  @Put('rules/:id')
  async updateRule(
    @CurrentUser() user: AuthUserDTO,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowRuleDTO,
  ) {
    const rule = await this.prisma.workflowRule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.trigger !== undefined
          ? { trigger: dto.trigger as unknown as Record<string, unknown> }
          : {}),
        ...(dto.actions !== undefined
          ? { actions: dto.actions as unknown as Record<string, unknown>[] }
          : {}),
      },
    });
    return apiSuccess(rule);
  }

  @Delete('rules/:id')
  async deleteRule(@CurrentUser() user: AuthUserDTO, @Param('id') id: string) {
    await this.prisma.workflowRule.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  }
}

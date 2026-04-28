import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { apiSuccess } from '../../common/api-response';
import type { AuthUserDTO, CreateWorkflowRuleDTO, UpdateWorkflowRuleDTO } from '@superboard/shared';

import { AutomationService } from './automation.service';
import { NeuralAgentService } from './neural-agent.service';
import { SingularityService } from './singularity.service';
import { SymbiosisService } from './symbiosis.service';
import { ExecutiveService } from './executive.service';

@Controller('automation')
export class AutomationController {
  constructor(
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
    const data = await this.automationService.getHealth(workspaceId);
    return apiSuccess(data);
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
    const rules = await this.automationService.getRules(workspaceId, projectId);
    return apiSuccess(rules);
  }

  @Post('rules')
  async createRule(
    @CurrentUser() user: AuthUserDTO,
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateWorkflowRuleDTO,
  ) {
    const rule = await this.automationService.createRule(workspaceId, dto);
    return apiSuccess(rule);
  }

  @Put('rules/:id')
  async updateRule(
    @CurrentUser() user: AuthUserDTO,
    @Param('id') id: string,
    @Body() dto: UpdateWorkflowRuleDTO,
  ) {
    const rule = await this.automationService.updateRule(id, dto);
    return apiSuccess(rule);
  }

  @Delete('rules/:id')
  async deleteRule(@CurrentUser() user: AuthUserDTO, @Param('id') id: string) {
    await this.automationService.deleteRule(id);
    return apiSuccess({ deleted: true });
  }
}

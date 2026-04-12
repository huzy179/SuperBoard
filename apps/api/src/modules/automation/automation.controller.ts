import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { apiSuccess } from '../../common/api-response';
import type { AuthUserDTO, CreateWorkflowRuleDTO, UpdateWorkflowRuleDTO } from '@superboard/shared';

@Controller('automation')
export class AutomationController {
  constructor(private prisma: PrismaService) {}

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

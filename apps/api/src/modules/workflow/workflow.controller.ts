import { Controller, Get, Param } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import type { WorkflowStatusDTO } from '@superboard/shared';

@Controller('workflow')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get('workspace/:workspaceId/statuses')
  async getWorkspaceStatuses(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkflowStatusDTO[]> {
    return this.workflowService.getWorkspaceStatuses(workspaceId);
  }

  @Get('project/:projectId/statuses')
  async getProjectStatuses(@Param('projectId') projectId: string): Promise<WorkflowStatusDTO[]> {
    return this.workflowService.getProjectStatuses(projectId);
  }
}

import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import type {
  WorkflowStatusDTO,
  CreateWorkflowStatusRequestDTO,
  UpdateWorkflowStatusRequestDTO,
  DeleteStatusRequestDTO,
  UpdateTransitionsRequestDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';

@Controller('workflow')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get('workspace/:workspaceId/statuses')
  async getWorkspaceStatuses(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkflowStatusDTO[]> {
    return this.workflowService.getWorkspaceStatuses(workspaceId);
  }

  @Get('workspace/:workspaceId')
  async getWorkspaceWorkflow(
    @Param('workspaceId') workspaceId: string,
  ): Promise<WorkflowStatusTemplateDTO> {
    return this.workflowService.getWorkspaceWorkflow(workspaceId);
  }

  @Post('workspace/:workspaceId/statuses')
  async createWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> {
    return this.workflowService.createWorkspaceStatus(workspaceId, body);
  }

  @Patch('workspace/:workspaceId/statuses/:statusId')
  async updateWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
    @Body() body: UpdateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> {
    return this.workflowService.updateWorkspaceStatus(workspaceId, statusId, body);
  }

  @Delete('workspace/:workspaceId/statuses/:statusId')
  async deleteWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
  ): Promise<void> {
    return this.workflowService.deleteWorkspaceStatus(workspaceId, statusId);
  }

  @Post('workspace/:workspaceId/transitions')
  async updateWorkspaceTransitions(
    @Param('workspaceId') workspaceId: string,
    @Body() body: UpdateTransitionsRequestDTO,
  ): Promise<void> {
    return this.workflowService.updateWorkspaceTransitions(workspaceId, body.transitions);
  }

  @Post('workspace/:workspaceId/sync')
  async syncWorkspaceWorkflow(@Param('workspaceId') workspaceId: string): Promise<void> {
    // This method needs to be implemented in WorkflowService
    // For now, I'll assume it exists or I'll add it.
    // wait, I checked WorkflowService earlier and it has cloneWorkspaceTemplateToProject(workspaceId, projectId)
    // but not a bulk sync. I'll need to add bulk sync to WorkflowService too.
    return this.workflowService.syncWorkspaceToProjects(workspaceId);
  }

  @Get('project/:projectId/statuses')
  async getProjectStatuses(@Param('projectId') projectId: string): Promise<WorkflowStatusDTO[]> {
    return this.workflowService.getProjectStatuses(projectId);
  }

  @Get('project/:projectId')
  async getProjectWorkflow(
    @Param('projectId') projectId: string,
  ): Promise<WorkflowStatusTemplateDTO> {
    return this.workflowService.getProjectWorkflow(projectId);
  }

  @Post('project/:projectId/statuses')
  async createProjectStatus(
    @Param('projectId') projectId: string,
    @Body() body: CreateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> {
    return this.workflowService.createProjectStatus(projectId, body);
  }

  @Patch('project/:projectId/statuses/:statusId')
  async updateProjectStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() body: UpdateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> {
    return this.workflowService.updateProjectStatus(projectId, statusId, body);
  }

  @Delete('project/:projectId/statuses/:statusId')
  async deleteProjectStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() body: DeleteStatusRequestDTO,
  ): Promise<void> {
    return this.workflowService.deleteProjectStatus(projectId, statusId, body.migrateToId);
  }

  @Post('project/:projectId/transitions')
  async updateProjectTransitions(
    @Param('projectId') projectId: string,
    @Body() body: UpdateTransitionsRequestDTO,
  ): Promise<void> {
    return this.workflowService.updateProjectTransitions(projectId, body.transitions);
  }
}

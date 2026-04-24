import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { apiSuccess } from '../../common/api-response';
import type {
  CreateWorkflowStatusRequestDTO,
  UpdateWorkflowStatusRequestDTO,
  DeleteStatusRequestDTO,
  UpdateTransitionsRequestDTO,
} from '@superboard/shared';

@Controller('workflow')
export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  @Get('workspace/:workspaceId/statuses')
  async getWorkspaceStatuses(@Param('workspaceId') workspaceId: string) {
    const data = await this.workflowService.getWorkspaceStatuses(workspaceId);
    return apiSuccess(data);
  }

  @Get('workspace/:workspaceId')
  async getWorkspaceWorkflow(@Param('workspaceId') workspaceId: string) {
    const data = await this.workflowService.getWorkspaceWorkflow(workspaceId);
    return apiSuccess(data);
  }

  @Post('workspace/:workspaceId/statuses')
  async createWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateWorkflowStatusRequestDTO,
  ) {
    const data = await this.workflowService.createWorkspaceStatus(workspaceId, body);
    return apiSuccess(data);
  }

  @Patch('workspace/:workspaceId/statuses/:statusId')
  async updateWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
    @Body() body: UpdateWorkflowStatusRequestDTO,
  ) {
    const data = await this.workflowService.updateWorkspaceStatus(workspaceId, statusId, body);
    return apiSuccess(data);
  }

  @Delete('workspace/:workspaceId/statuses/:statusId')
  async deleteWorkspaceStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('statusId') statusId: string,
  ) {
    await this.workflowService.deleteWorkspaceStatus(workspaceId, statusId);
    return apiSuccess({ deleted: true });
  }

  @Post('workspace/:workspaceId/transitions')
  async updateWorkspaceTransitions(
    @Param('workspaceId') workspaceId: string,
    @Body() body: UpdateTransitionsRequestDTO,
  ) {
    await this.workflowService.updateWorkspaceTransitions(workspaceId, body.transitions);
    return apiSuccess({ updated: true });
  }

  @Post('workspace/:workspaceId/sync')
  async syncWorkspaceWorkflow(@Param('workspaceId') workspaceId: string) {
    // This method needs to be implemented in WorkflowService
    // For now, I'll assume it exists or I'll add it.
    // wait, I checked WorkflowService earlier and it has cloneWorkspaceTemplateToProject(workspaceId, projectId)
    // but not a bulk sync. I'll need to add bulk sync to WorkflowService too.
    await this.workflowService.syncWorkspaceToProjects(workspaceId);
    return apiSuccess({ synced: true });
  }

  @Get('project/:projectId/statuses')
  async getProjectStatuses(@Param('projectId') projectId: string) {
    const data = await this.workflowService.getProjectStatuses(projectId);
    return apiSuccess(data);
  }

  @Get('project/:projectId')
  async getProjectWorkflow(@Param('projectId') projectId: string) {
    const data = await this.workflowService.getProjectWorkflow(projectId);
    return apiSuccess(data);
  }

  @Post('project/:projectId/statuses')
  async createProjectStatus(
    @Param('projectId') projectId: string,
    @Body() body: CreateWorkflowStatusRequestDTO,
  ) {
    const data = await this.workflowService.createProjectStatus(projectId, body);
    return apiSuccess(data);
  }

  @Patch('project/:projectId/statuses/:statusId')
  async updateProjectStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() body: UpdateWorkflowStatusRequestDTO,
  ) {
    const data = await this.workflowService.updateProjectStatus(projectId, statusId, body);
    return apiSuccess(data);
  }

  @Delete('project/:projectId/statuses/:statusId')
  async deleteProjectStatus(
    @Param('projectId') projectId: string,
    @Param('statusId') statusId: string,
    @Body() body: DeleteStatusRequestDTO,
  ) {
    await this.workflowService.deleteProjectStatus(projectId, statusId, body.migrateToId);
    return apiSuccess({ deleted: true });
  }

  @Post('project/:projectId/transitions')
  async updateProjectTransitions(
    @Param('projectId') projectId: string,
    @Body() body: UpdateTransitionsRequestDTO,
  ) {
    await this.workflowService.updateProjectTransitions(projectId, body.transitions);
    return apiSuccess({ updated: true });
  }
}

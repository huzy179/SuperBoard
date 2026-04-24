import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  WorkflowStatusDTO,
  CreateWorkflowStatusRequestDTO,
  UpdateWorkflowStatusRequestDTO,
  DeleteStatusRequestDTO,
  UpdateTransitionsRequestDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';

// Project Workflow
export const getProjectWorkflow = (projectId: string) =>
  authApi.get<WorkflowStatusTemplateDTO>(API_ENDPOINTS.workflow.projectWorkflow(projectId));

export const createProjectStatus = (projectId: string, data: CreateWorkflowStatusRequestDTO) =>
  authApi.post<WorkflowStatusDTO>(API_ENDPOINTS.workflow.projectStatuses(projectId), data);

export const updateProjectStatus = (
  projectId: string,
  statusId: string,
  data: UpdateWorkflowStatusRequestDTO,
) =>
  authApi.patch<WorkflowStatusDTO>(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), data);

export const deleteProjectStatus = (
  projectId: string,
  statusId: string,
  data: DeleteStatusRequestDTO,
) =>
  authApi.delete(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), {
    body: data,
  });

export const updateProjectTransitions = (projectId: string, data: UpdateTransitionsRequestDTO) =>
  authApi.post(API_ENDPOINTS.workflow.transitions(projectId), data);

// Workspace Workflow
export const getWorkspaceWorkflow = (workspaceId: string) =>
  authApi.get<WorkflowStatusTemplateDTO>(API_ENDPOINTS.workflow.workspaceWorkflow(workspaceId));

export const createWorkspaceStatus = (workspaceId: string, data: CreateWorkflowStatusRequestDTO) =>
  authApi.post<WorkflowStatusDTO>(API_ENDPOINTS.workflow.workspaceStatuses(workspaceId), data);

export const updateWorkspaceStatus = (
  workspaceId: string,
  statusId: string,
  data: UpdateWorkflowStatusRequestDTO,
) =>
  authApi.patch<WorkflowStatusDTO>(
    API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId),
    data,
  );

export const deleteWorkspaceStatus = (
  workspaceId: string,
  statusId: string,
  data?: DeleteStatusRequestDTO,
) =>
  authApi.delete(API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId), {
    body: data,
  });

export const updateWorkspaceTransitions = (
  workspaceId: string,
  data: UpdateTransitionsRequestDTO,
) => authApi.post(API_ENDPOINTS.workflow.workspaceTransitions(workspaceId), data);

export const syncWorkspaceWorkflow = (workspaceId: string) =>
  authApi.post<{ success: boolean }>(API_ENDPOINTS.workflow.syncTemplate(workspaceId));

export type ProjectWorkflowDTO = WorkflowStatusTemplateDTO;

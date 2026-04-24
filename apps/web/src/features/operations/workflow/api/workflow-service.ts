import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type {
  WorkflowStatusDTO,
  CreateWorkflowStatusRequestDTO,
  UpdateWorkflowStatusRequestDTO,
  DeleteStatusRequestDTO,
  UpdateTransitionsRequestDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';

export async function getProjectWorkflow(projectId: string): Promise<WorkflowStatusTemplateDTO> {
  return apiGet<WorkflowStatusTemplateDTO>(API_ENDPOINTS.workflow.projectWorkflow(projectId), {
    auth: true,
  });
}

export async function createProjectStatus(
  projectId: string,
  data: CreateWorkflowStatusRequestDTO,
): Promise<WorkflowStatusDTO> {
  return apiPost<WorkflowStatusDTO>(API_ENDPOINTS.workflow.projectStatuses(projectId), data, {
    auth: true,
  });
}

export async function updateProjectStatus(
  projectId: string,
  statusId: string,
  data: UpdateWorkflowStatusRequestDTO,
): Promise<WorkflowStatusDTO> {
  return apiPatch<WorkflowStatusDTO>(
    API_ENDPOINTS.workflow.statusDetail(projectId, statusId),
    data,
    { auth: true },
  );
}

export async function deleteProjectStatus(
  projectId: string,
  statusId: string,
  data: DeleteStatusRequestDTO,
): Promise<void> {
  await apiDelete(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), {
    auth: true,
    body: data,
  });
}

export async function updateProjectTransitions(
  projectId: string,
  data: UpdateTransitionsRequestDTO,
): Promise<void> {
  await apiPost(API_ENDPOINTS.workflow.transitions(projectId), data, { auth: true });
}

// Workspace Workflow Functions
export async function getWorkspaceWorkflow(
  workspaceId: string,
): Promise<WorkflowStatusTemplateDTO> {
  return apiGet<WorkflowStatusTemplateDTO>(API_ENDPOINTS.workflow.workspaceWorkflow(workspaceId), {
    auth: true,
  });
}

export async function createWorkspaceStatus(
  workspaceId: string,
  data: CreateWorkflowStatusRequestDTO,
): Promise<WorkflowStatusDTO> {
  return apiPost<WorkflowStatusDTO>(API_ENDPOINTS.workflow.workspaceStatuses(workspaceId), data, {
    auth: true,
  });
}

export async function updateWorkspaceStatus(
  workspaceId: string,
  statusId: string,
  data: UpdateWorkflowStatusRequestDTO,
): Promise<WorkflowStatusDTO> {
  return apiPatch<WorkflowStatusDTO>(
    API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId),
    data,
    { auth: true },
  );
}

export async function deleteWorkspaceStatus(
  workspaceId: string,
  statusId: string,
  data?: DeleteStatusRequestDTO,
): Promise<void> {
  await apiDelete(API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId), {
    auth: true,
    body: data,
  });
}

export async function updateWorkspaceTransitions(
  workspaceId: string,
  data: UpdateTransitionsRequestDTO,
): Promise<void> {
  await apiPost(API_ENDPOINTS.workflow.workspaceTransitions(workspaceId), data, { auth: true });
}

export async function syncWorkspaceWorkflow(workspaceId: string): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    API_ENDPOINTS.workflow.syncTemplate(workspaceId),
    {},
    { auth: true },
  );
}

export type ProjectWorkflowDTO = WorkflowStatusTemplateDTO;

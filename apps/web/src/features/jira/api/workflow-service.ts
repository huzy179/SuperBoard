import { apiGet, apiPost, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { WorkflowStatusCategory } from '@superboard/shared';

export interface ProjectWorkflowDTO {
  statuses: {
    id: string;
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position: number;
    isSystem: boolean;
  }[];
  transitions: {
    id: string;
    fromStatusId: string;
    toStatusId: string;
  }[];
}

export async function getProjectWorkflow(projectId: string): Promise<ProjectWorkflowDTO> {
  return apiGet<ProjectWorkflowDTO>(API_ENDPOINTS.workflow.projectWorkflow(projectId), {
    auth: true,
  });
}

export async function createProjectStatus(
  projectId: string,
  payload: {
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position?: number;
  },
): Promise<void> {
  return apiPost(API_ENDPOINTS.workflow.projectStatuses(projectId), payload, {
    auth: true,
  });
}

export async function updateProjectStatus(
  projectId: string,
  statusId: string,
  payload: {
    name?: string;
    category?: WorkflowStatusCategory;
    position?: number;
  },
): Promise<void> {
  return apiRequest(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), {
    auth: true,
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteProjectStatus(
  projectId: string,
  statusId: string,
  payload: { migrateToId: string },
): Promise<void> {
  return apiRequest(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), {
    auth: true,
    method: 'DELETE',
    body: payload,
  });
}

export async function updateProjectTransitions(
  projectId: string,
  payload: {
    transitions: { fromStatusId: string; toStatusId: string }[];
  },
): Promise<void> {
  return apiPost(API_ENDPOINTS.workflow.transitions(projectId), payload, {
    auth: true,
  });
}

// Workspace Workflow
export async function getWorkspaceWorkflow(workspaceId: string): Promise<ProjectWorkflowDTO> {
  return apiGet<ProjectWorkflowDTO>(API_ENDPOINTS.workflow.workspaceWorkflow(workspaceId), {
    auth: true,
  });
}

export async function createWorkspaceStatus(
  workspaceId: string,
  payload: {
    key: string;
    name: string;
    category: WorkflowStatusCategory;
    position?: number;
  },
): Promise<void> {
  return apiPost(API_ENDPOINTS.workflow.workspaceStatuses(workspaceId), payload, {
    auth: true,
  });
}

export async function updateWorkspaceStatus(
  workspaceId: string,
  statusId: string,
  payload: {
    name?: string;
    category?: WorkflowStatusCategory;
    position?: number;
  },
): Promise<void> {
  return apiRequest(API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId), {
    auth: true,
    method: 'PATCH',
    body: payload,
  });
}

export async function deleteWorkspaceStatus(
  workspaceId: string,
  statusId: string,
  payload?: { migrateToId?: string },
): Promise<void> {
  return apiRequest(API_ENDPOINTS.workflow.workspaceStatusDetail(workspaceId, statusId), {
    auth: true,
    method: 'DELETE',
    body: payload,
  });
}

export async function updateWorkspaceTransitions(
  workspaceId: string,
  payload: {
    transitions: { fromStatusId: string; toStatusId: string }[];
  },
): Promise<void> {
  return apiPost(API_ENDPOINTS.workflow.workspaceTransitions(workspaceId), payload, {
    auth: true,
  });
}

export async function syncWorkspaceWorkflow(workspaceId: string): Promise<void> {
  return apiPost(
    API_ENDPOINTS.workflow.syncTemplate(workspaceId),
    {},
    {
      auth: true,
    },
  );
}

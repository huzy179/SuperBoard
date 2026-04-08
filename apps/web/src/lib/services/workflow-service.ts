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

export const workflowService = {
  getProjectStatuses: async (projectId: string): Promise<WorkflowStatusDTO[]> => {
    return apiGet<WorkflowStatusDTO[]>(API_ENDPOINTS.workflow.projectStatuses(projectId), {
      auth: true,
    });
  },

  getProjectWorkflow: async (projectId: string): Promise<WorkflowStatusTemplateDTO> => {
    return apiGet<WorkflowStatusTemplateDTO>(API_ENDPOINTS.workflow.projectWorkflow(projectId), {
      auth: true,
    });
  },

  createProjectStatus: async (
    projectId: string,
    data: CreateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> => {
    return apiPost<WorkflowStatusDTO>(API_ENDPOINTS.workflow.projectStatuses(projectId), data, {
      auth: true,
    });
  },

  updateProjectStatus: async (
    projectId: string,
    statusId: string,
    data: UpdateWorkflowStatusRequestDTO,
  ): Promise<WorkflowStatusDTO> => {
    return apiPatch<WorkflowStatusDTO>(
      API_ENDPOINTS.workflow.statusDetail(projectId, statusId),
      data,
      { auth: true },
    );
  },

  deleteProjectStatus: async (
    projectId: string,
    statusId: string,
    data: DeleteStatusRequestDTO,
  ): Promise<void> => {
    await apiDelete(API_ENDPOINTS.workflow.statusDetail(projectId, statusId), {
      auth: true,
      body: data,
    });
  },

  updateProjectTransitions: async (
    projectId: string,
    data: UpdateTransitionsRequestDTO,
  ): Promise<void> => {
    await apiPost(API_ENDPOINTS.workflow.transitions(projectId), data, { auth: true });
  },
};

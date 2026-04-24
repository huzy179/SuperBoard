import { useQuery } from '@tanstack/react-query';
import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import {
  getProjectWorkflow,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
  updateProjectTransitions,
  ProjectWorkflowDTO,
  getWorkspaceWorkflow,
  createWorkspaceStatus,
  updateWorkspaceStatus,
  deleteWorkspaceStatus,
  updateWorkspaceTransitions,
  syncWorkspaceWorkflow,
} from '../api/workflow-service';
import { WorkflowStatusCategory, DeleteStatusRequestDTO } from '@superboard/shared';

const workflowQueryKey = (projectId: string) => ['projects', projectId, 'workflow'] as const;

export function useProjectWorkflow(projectId: string) {
  return useQuery<ProjectWorkflowDTO>({
    queryKey: workflowQueryKey(projectId),
    queryFn: () => getProjectWorkflow(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectStatus(projectId: string) {
  return useAppMutation({
    mutationFn: (payload: {
      key: string;
      name: string;
      category: WorkflowStatusCategory;
      position?: number;
    }) => createProjectStatus(projectId, payload),
    resource: 'Trạng thái',
    action: 'create',
    invalidateKeys: [workflowQueryKey(projectId)],
  });
}

export function useUpdateProjectStatus(projectId: string) {
  return useAppMutation({
    mutationFn: ({
      statusId,
      data,
    }: {
      statusId: string;
      data: { name?: string; category?: WorkflowStatusCategory; position?: number };
    }) => updateProjectStatus(projectId, statusId, data),
    resource: 'Trạng thái',
    action: 'update',
    invalidateKeys: [workflowQueryKey(projectId)],
  });
}

export function useDeleteProjectStatus(projectId: string) {
  return useAppMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: { migrateToId: string } }) =>
      deleteProjectStatus(projectId, statusId, data),
    resource: 'Trạng thái',
    action: 'delete',
    invalidateKeys: [workflowQueryKey(projectId)],
  });
}

export function useUpdateProjectTransitions(projectId: string) {
  return useAppMutation({
    mutationFn: (payload: { transitions: { fromStatusId: string; toStatusId: string }[] }) =>
      updateProjectTransitions(projectId, payload),
    resource: 'Quy trình',
    action: 'update',
    invalidateKeys: [workflowQueryKey(projectId)],
  });
}

// Workspace Workflow Hooks
const workspaceWorkflowQueryKey = (workspaceId: string) =>
  ['workspaces', workspaceId, 'workflow'] as const;

export function useWorkspaceWorkflow(workspaceId: string) {
  return useQuery<ProjectWorkflowDTO>({
    queryKey: workspaceWorkflowQueryKey(workspaceId),
    queryFn: () => getWorkspaceWorkflow(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspaceStatus(workspaceId: string) {
  return useAppMutation({
    mutationFn: (payload: {
      key: string;
      name: string;
      category: WorkflowStatusCategory;
      position?: number;
    }) => createWorkspaceStatus(workspaceId, payload),
    resource: 'Trạng thái workspace',
    action: 'create',
    invalidateKeys: [workspaceWorkflowQueryKey(workspaceId)],
  });
}

export function useUpdateWorkspaceStatus(workspaceId: string) {
  return useAppMutation({
    mutationFn: ({
      statusId,
      data,
    }: {
      statusId: string;
      data: { name?: string; category?: WorkflowStatusCategory; position?: number };
    }) => updateWorkspaceStatus(workspaceId, statusId, data),
    resource: 'Trạng thái workspace',
    action: 'update',
    invalidateKeys: [workspaceWorkflowQueryKey(workspaceId)],
  });
}

export function useDeleteWorkspaceStatus(workspaceId: string) {
  return useAppMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data?: DeleteStatusRequestDTO }) =>
      deleteWorkspaceStatus(workspaceId, statusId, data),
    resource: 'Trạng thái workspace',
    action: 'delete',
    invalidateKeys: [workspaceWorkflowQueryKey(workspaceId)],
  });
}

export function useUpdateWorkspaceTransitions(workspaceId: string) {
  return useAppMutation({
    mutationFn: (payload: { transitions: { fromStatusId: string; toStatusId: string }[] }) =>
      updateWorkspaceTransitions(workspaceId, payload),
    resource: 'Quy trình workspace',
    action: 'update',
    invalidateKeys: [workspaceWorkflowQueryKey(workspaceId)],
  });
}

export function useSyncWorkspaceWorkflow(workspaceId: string) {
  return useAppMutation({
    mutationFn: () => syncWorkspaceWorkflow(workspaceId),
    resource: 'Quy trình',
    action: 'sync',
    successMessage: 'Đã đồng bộ quy trình cho tất cả dự án trong workspace',
    invalidateKeys: [['projects']],
  });
}

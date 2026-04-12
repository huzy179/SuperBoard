import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getProjectWorkflow,
  createProjectStatus,
  updateProjectStatus,
  deleteProjectStatus,
  updateProjectTransitions,
  ProjectWorkflowDTO,
} from '../api/workflow-service';
import { WorkflowStatusCategory } from '@superboard/shared';

const workflowQueryKey = (projectId: string) => ['projects', projectId, 'workflow'] as const;

export function useProjectWorkflow(projectId: string) {
  return useQuery<ProjectWorkflowDTO>({
    queryKey: workflowQueryKey(projectId),
    queryFn: () => getProjectWorkflow(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      key: string;
      name: string;
      category: WorkflowStatusCategory;
      position?: number;
    }) => createProjectStatus(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowQueryKey(projectId) });
    },
  });
}

export function useUpdateProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      statusId,
      data,
    }: {
      statusId: string;
      data: { name?: string; category?: WorkflowStatusCategory; position?: number };
    }) => updateProjectStatus(projectId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowQueryKey(projectId) });
    },
  });
}

export function useDeleteProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: { migrateToId: string } }) =>
      deleteProjectStatus(projectId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowQueryKey(projectId) });
      toast.success('Xoá trạng thái thành công');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi xoá trạng thái');
    },
  });
}

export function useUpdateProjectTransitions(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { transitions: { fromStatusId: string; toStatusId: string }[] }) =>
      updateProjectTransitions(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workflowQueryKey(projectId) });
    },
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      key: string;
      name: string;
      category: WorkflowStatusCategory;
      position?: number;
    }) => createWorkspaceStatus(workspaceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceWorkflowQueryKey(workspaceId) });
    },
  });
}

export function useUpdateWorkspaceStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      statusId,
      data,
    }: {
      statusId: string;
      data: { name?: string; category?: WorkflowStatusCategory; position?: number };
    }) => updateWorkspaceStatus(workspaceId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceWorkflowQueryKey(workspaceId) });
    },
  });
}

export function useDeleteWorkspaceStatus(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data?: { migrateToId?: string } }) =>
      deleteWorkspaceStatus(workspaceId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceWorkflowQueryKey(workspaceId) });
      toast.success('Xoá trạng thái workspace thành công');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi xoá trạng thái workspace');
    },
  });
}

export function useUpdateWorkspaceTransitions(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { transitions: { fromStatusId: string; toStatusId: string }[] }) =>
      updateWorkspaceTransitions(workspaceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceWorkflowQueryKey(workspaceId) });
    },
  });
}

export function useSyncWorkspaceWorkflow(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncWorkspaceWorkflow(workspaceId),
    onSuccess: () => {
      toast.success('Đã đồng bộ quy trình cho tất cả dự án trong workspace');
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Lỗi khi đồng bộ quy trình');
    },
  });
}

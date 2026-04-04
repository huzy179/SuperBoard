import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workflowService } from '@/lib/services/workflow-service';
import type {
  CreateWorkflowStatusRequestDTO,
  UpdateWorkflowStatusRequestDTO,
  DeleteStatusRequestDTO,
  UpdateTransitionsRequestDTO,
} from '@superboard/shared';

export function useProjectStatuses(projectId: string) {
  return useQuery({
    queryKey: ['workflow', 'project', projectId, 'statuses'],
    queryFn: () => workflowService.getProjectStatuses(projectId),
    enabled: !!projectId,
  });
}

export function useProjectWorkflow(projectId: string) {
  return useQuery({
    queryKey: ['workflow', 'project', projectId, 'detail'],
    queryFn: () => workflowService.getProjectWorkflow(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkflowStatusRequestDTO) =>
      workflowService.createProjectStatus(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflow', 'project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: UpdateWorkflowStatusRequestDTO }) =>
      workflowService.updateProjectStatus(projectId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflow', 'project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useDeleteProjectStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ statusId, data }: { statusId: string; data: DeleteStatusRequestDTO }) =>
      workflowService.deleteProjectStatus(projectId, statusId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflow', 'project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

export function useUpdateProjectTransitions(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTransitionsRequestDTO) =>
      workflowService.updateProjectTransitions(projectId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workflow', 'project', projectId] });
      void queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });
}

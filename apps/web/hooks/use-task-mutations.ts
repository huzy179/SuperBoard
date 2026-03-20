import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateTaskRequestDTO,
  ProjectDetailDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';
import {
  createProjectTask,
  deleteProjectTask,
  updateProjectTask,
  updateProjectTaskStatus,
} from '@/lib/services/project-service';

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequestDTO) => createProjectTask(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequestDTO }) =>
      updateProjectTask(projectId, taskId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
    }: {
      taskId: string;
      status: UpdateTaskStatusRequestDTO['status'];
    }) => updateProjectTaskStatus(projectId, taskId, { status }),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });

      const previous = queryClient.getQueryData<ProjectDetailDTO>(['projects', projectId]);

      if (previous) {
        queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], {
          ...previous,
          tasks: previous.tasks.map((task) => (task.id === taskId ? { ...task, status } : task)),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteProjectTask(projectId, taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

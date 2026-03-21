import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BulkTaskOperationRequestDTO,
  CreateTaskRequestDTO,
  ProjectDetailDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';
import {
  bulkProjectTaskOperation,
  createProjectTask,
  deleteProjectTask,
  updateProjectTask,
  updateProjectTaskStatus,
} from '@/lib/services/project-service';
import { publishProjectDetailUpdated } from '@/lib/realtime/project-sync';

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequestDTO) => createProjectTask(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      publishProjectDetailUpdated(projectId);
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
      publishProjectDetailUpdated(projectId);
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
    onSuccess: () => {
      publishProjectDetailUpdated(projectId);
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
      publishProjectDetailUpdated(projectId);
    },
  });
}

export function useBulkTaskOperation(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkTaskOperationRequestDTO) =>
      bulkProjectTaskOperation(projectId, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });

      const previous = queryClient.getQueryData<ProjectDetailDTO>(['projects', projectId]);

      if (previous) {
        const taskIds = new Set(payload.taskIds);

        if (payload.delete) {
          queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], {
            ...previous,
            tasks: previous.tasks.filter((task) => !taskIds.has(task.id)),
          });
        } else {
          const hasStatusUpdate = payload.status !== undefined;
          const hasAssigneeUpdate = payload.assigneeId !== undefined;
          const assigneeMember = hasAssigneeUpdate
            ? previous.members.find((member) => member.id === payload.assigneeId)
            : undefined;

          queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], {
            ...previous,
            tasks: previous.tasks.map((task) => {
              if (!taskIds.has(task.id)) {
                return task;
              }

              return {
                ...task,
                ...(hasStatusUpdate ? { status: payload.status } : {}),
                ...(hasAssigneeUpdate
                  ? payload.assigneeId
                    ? {
                        assigneeId: payload.assigneeId,
                        assigneeName: assigneeMember?.fullName ?? null,
                        assigneeAvatarColor: assigneeMember?.avatarColor ?? null,
                      }
                    : {
                        assigneeId: null,
                        assigneeName: null,
                        assigneeAvatarColor: null,
                      }
                  : {}),
              };
            }),
          });
        }
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSuccess: () => {
      publishProjectDetailUpdated(projectId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  BulkTaskOperationRequestDTO,
  CreateTaskRequestDTO,
  ProjectDetailDTO,
  UpdateTaskRequestDTO,
  UpdateTaskStatusRequestDTO,
} from '@superboard/shared';
import {
  archiveTask,
  bulkProjectTaskOperation,
  createProjectTask,
  deleteProjectTask,
  restoreTask,
  summarizeProjectTask,
  aiDecomposeTask,
  aiRefineTask,
  updateProjectTaskStatus,
  getTaskIntelligence,
} from '@/features/jira/api/task-service';
import { publishProjectDetailUpdated } from '@/lib/realtime/project-sync';

export function useSummarizeTask() {
  return useMutation({
    mutationFn: (taskId: string) => summarizeProjectTask(taskId),
  });
}

export function useAiDecompose() {
  return useMutation({
    mutationFn: (taskId: string) => aiDecomposeTask(taskId),
  });
}

export function useAiRefine() {
  return useMutation({
    mutationFn: (taskId: string) => aiRefineTask(taskId),
  });
}

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTaskRequestDTO) => createProjectTask(projectId, payload),
    onSuccess: () => {
      toast.success('Tạo task thành công!');
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      publishProjectDetailUpdated(projectId);
    },
    onError: () => {
      toast.error('Không thể tạo task');
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequestDTO }) =>
      updateProjectTask(projectId, taskId, data),
    onSuccess: (_data, variables) => {
      toast.success('Cập nhật task thành công!');
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      void queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks', variables.taskId, 'history'],
      });
      publishProjectDetailUpdated(projectId);
    },
    onError: () => {
      toast.error('Không thể cập nhật task');
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      status,
      position,
    }: {
      taskId: string;
      status: UpdateTaskStatusRequestDTO['status'];
      position?: string | null;
    }) =>
      updateProjectTaskStatus(projectId, taskId, {
        status,
        ...(position !== undefined ? { position } : {}),
      }),
    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });

      const previous = queryClient.getQueryData<ProjectDetailDTO>(['projects', projectId]);

      if (previous) {
        queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], {
          ...previous,
          tasks: previous.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status,
                  ...(position !== undefined ? { position } : {}),
                }
              : task,
          ),
        });
      }

      return { previous };
    },
    onError: (error: Error, variables, context) => {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái';
      toast.error(errorMessage, {
        action: {
          label: 'Thử lại',
          onClick: () => {
            // Trigger same mutation again
            queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
          },
        },
      });

      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks', variables.taskId, 'history'],
      });
      publishProjectDetailUpdated(projectId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useArchiveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => archiveTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId] });
      const previous = queryClient.getQueryData<ProjectDetailDTO>(['projects', projectId]);

      if (previous) {
        queryClient.setQueryData<ProjectDetailDTO>(['projects', projectId], {
          ...previous,
          tasks: previous.tasks.filter((t) => t.id !== taskId),
        });
      }

      return { previous };
    },
    onSuccess: () => {
      toast.success('Đã lưu trữ task');
      publishProjectDetailUpdated(projectId);
    },
    onError: (_error, _variables, context) => {
      toast.error('Không thể lưu trữ task');
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useRestoreTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => restoreTask(taskId),
    onSuccess: () => {
      toast.success('Đã khôi phục task');
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      publishProjectDetailUpdated(projectId);
    },
    onError: () => {
      toast.error('Không thể khôi phục task');
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteProjectTask(projectId, taskId),
    onSuccess: (_data, taskId) => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
      void queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks', taskId, 'history'],
      });
      publishProjectDetailUpdated(projectId);
    },
    onError: () => {
      toast.error('Không thể xoá task');
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
          const hasPriorityUpdate = payload.priority !== undefined;
          const hasTypeUpdate = payload.type !== undefined;
          const hasDueDateUpdate = payload.dueDate !== undefined;
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
                ...(hasPriorityUpdate ? { priority: payload.priority } : {}),
                ...(hasTypeUpdate ? { type: payload.type } : {}),
                ...(hasDueDateUpdate ? { dueDate: payload.dueDate ?? null } : {}),
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
      toast.error('Không thể thực hiện thao tác hàng loạt');
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSuccess: (_data, variables) => {
      const count = variables.taskIds.length;
      toast.success(`Đã cập nhật ${count} task thành công!`);
      for (const taskId of variables.taskIds) {
        void queryClient.invalidateQueries({
          queryKey: ['projects', projectId, 'tasks', taskId, 'history'],
        });
      }
      publishProjectDetailUpdated(projectId);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}

export function useTaskIntelligence(taskId: string | undefined) {
  return useQuery({
    queryKey: ['tasks', taskId, 'intelligence'],
    queryFn: () => (taskId ? getTaskIntelligence(taskId) : Promise.reject('No task ID')),
    enabled: !!taskId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

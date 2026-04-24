import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { notify } from '@/lib/api/notification-handler';
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
  updateProjectTask,
  updateProjectTaskStatus,
  getTaskIntelligence,
} from '@/features/operations/task/api/task-service';
import { publishProjectDetailUpdated } from '@/lib/realtime/project-sync';

export function useSummarizeTask() {
  return useAppMutation({
    mutationFn: (taskId: string) => summarizeProjectTask(taskId),
    resource: 'Tóm tắt',
    action: 'sync',
  });
}

export function useAiDecompose() {
  return useAppMutation({
    mutationFn: (taskId: string) => aiDecomposeTask(taskId),
    resource: 'Phân rã task',
    action: 'sync',
  });
}

export function useAiRefine() {
  return useAppMutation({
    mutationFn: (taskId: string) => aiRefineTask(taskId),
    resource: 'Tối ưu task',
    action: 'sync',
  });
}

export function useCreateTask(projectId: string) {
  return useAppMutation({
    mutationFn: (payload: CreateTaskRequestDTO) => createProjectTask(projectId, payload),
    resource: 'Task',
    action: 'create',
    invalidateKeys: [['projects', projectId]],
    onSuccess: () => {
      publishProjectDetailUpdated(projectId);
    },
  });
}

export function useUpdateTask(projectId: string) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: UpdateTaskRequestDTO }) =>
      updateProjectTask(projectId, taskId, data),
    resource: 'Task',
    action: 'update',
    invalidateKeys: [['projects', projectId]],
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks', variables.taskId, 'history'],
      });
      publishProjectDetailUpdated(projectId);
    },
  });
}

export function useUpdateTaskStatus(projectId: string) {
  const queryClient = useQueryClient();
  return useAppMutation({
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
    resource: 'Trạng thái',
    action: 'update',
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
    onError: (_error, _variables, context) => {
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
  return useAppMutation({
    mutationFn: (taskId: string) => archiveTask(taskId),
    resource: 'Task',
    action: 'archive',
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

export function useRestoreTask(projectId: string) {
  return useAppMutation({
    mutationFn: (taskId: string) => restoreTask(taskId),
    resource: 'Task',
    action: 'restore',
    invalidateKeys: [['projects', projectId]],
    onSuccess: () => {
      publishProjectDetailUpdated(projectId);
    },
  });
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (taskId: string) => deleteProjectTask(projectId, taskId),
    resource: 'Task',
    action: 'delete',
    invalidateKeys: [['projects', projectId]],
    onSuccess: (_data, taskId) => {
      void queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'tasks', taskId, 'history'],
      });
      publishProjectDetailUpdated(projectId);
    },
  });
}

export function useBulkTaskOperation(projectId: string) {
  const queryClient = useQueryClient();
  return useAppMutation({
    mutationFn: (payload: BulkTaskOperationRequestDTO) =>
      bulkProjectTaskOperation(projectId, payload),
    resource: 'Thao tác hàng loạt',
    action: 'update',
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
              if (!taskIds.has(task.id)) return task;
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
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId], context.previous);
      }
    },
    onSuccess: (_data, variables) => {
      const count = variables.taskIds.length;
      notify.success('update', '', `Đã cập nhật ${count} task thành công!`);
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

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectRequestDTO, UpdateProjectRequestDTO } from '@superboard/shared';
import {
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
} from '@/lib/services/project-service';
import { publishProjectsListUpdated } from '@/lib/realtime/project-sync';

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequestDTO) => createProject(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      publishProjectsListUpdated();
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequestDTO }) =>
      updateProject(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      publishProjectsListUpdated();
    },
  });
}

export function useArchiveProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => archiveProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      publishProjectsListUpdated();
    },
  });
}

export function useRestoreProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
      publishProjectsListUpdated();
    },
  });
}

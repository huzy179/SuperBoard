import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import type { CreateProjectRequestDTO, UpdateProjectRequestDTO } from '@superboard/shared';
import {
  createProject,
  updateProject,
  archiveProject,
  restoreProject,
} from '@/features/operations/project/api/project-service';
import { publishProjectsListUpdated } from '@/lib/realtime/project-sync';

export function useCreateProject() {
  return useAppMutation({
    mutationFn: (data: CreateProjectRequestDTO) => createProject(data),
    resource: 'Dự án',
    action: 'create',
    invalidateKeys: [['projects']],
    onSuccess: () => {
      publishProjectsListUpdated();
    },
  });
}

export function useUpdateProject() {
  return useAppMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequestDTO }) =>
      updateProject(id, data),
    resource: 'Dự án',
    action: 'update',
    invalidateKeys: [['projects']],
    onSuccess: () => {
      publishProjectsListUpdated();
    },
  });
}

export function useArchiveProject() {
  return useAppMutation({
    mutationFn: (id: string) => archiveProject(id),
    resource: 'Dự án',
    action: 'archive',
    invalidateKeys: [['projects']],
    onSuccess: () => {
      publishProjectsListUpdated();
    },
  });
}

export function useRestoreProject() {
  return useAppMutation({
    mutationFn: (id: string) => restoreProject(id),
    resource: 'Dự án',
    action: 'restore',
    invalidateKeys: [['projects']],
    onSuccess: () => {
      publishProjectsListUpdated();
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateProjectRequestDTO, UpdateProjectRequestDTO } from '@superboard/shared';
import { createProject, updateProject, deleteProject } from '@/lib/services/project-service';

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProjectRequestDTO) => createProject(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
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
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

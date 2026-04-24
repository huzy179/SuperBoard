import { useState } from 'react';
import type {
  ProjectItemDTO,
  CreateProjectRequestDTO,
  UpdateProjectRequestDTO,
} from '@superboard/shared';
import {
  useCreateProject,
  useArchiveProject,
  useUpdateProject,
} from '@/features/operations/project/hooks/project-mutation-core';

export function useProjectCrudForm() {
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const archiveProjectMutation = useArchiveProject();

  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItemDTO | null>(null);

  async function handleCreateProject(values: CreateProjectRequestDTO) {
    await createProjectMutation.mutateAsync(values);
    setShowCreatePanel(false);
  }

  function openEditProject(project: ProjectItemDTO) {
    setEditingProject(project);
  }

  function closeEditProject() {
    setEditingProject(null);
  }

  async function handleUpdateProject(values: UpdateProjectRequestDTO) {
    if (!editingProject) return;
    await updateProjectMutation.mutateAsync({
      id: editingProject.id,
      data: values,
    });
    closeEditProject();
  }

  async function handleArchiveProject(projectId: string) {
    if (!confirm('Bạn chắc chắn muốn lưu trữ dự án này?')) return;
    await archiveProjectMutation.mutateAsync(projectId);
  }

  function isArchivingProject(projectId: string): boolean {
    return archiveProjectMutation.isPending && archiveProjectMutation.variables === projectId;
  }

  return {
    showCreatePanel,
    setShowCreatePanel,
    handleCreateProject,
    createProjectPending: createProjectMutation.isPending,
    editingProject,
    openEditProject,
    closeEditProject,
    handleUpdateProject,
    updateProjectPending: updateProjectMutation.isPending,
    handleArchiveProject,
    isArchivingProject,
    // Add these for backward compatibility if needed, or remove if dashboard updated
    createError: null,
    editError: null,
    archiveError: null,
  };
}

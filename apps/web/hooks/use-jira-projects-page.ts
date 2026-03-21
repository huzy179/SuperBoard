import { FormEvent, useMemo, useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { useProjects } from '@/hooks/use-projects';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/use-project-mutations';

export function useJiraProjectsPage() {
  const {
    data: projects = [],
    isLoading: projectsLoading,
    isError,
    error: projectsQueryError,
    refetch,
  } = useProjects();
  const projectsError = isError ? (projectsQueryError?.message ?? 'Không tải được dự án') : null;

  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectIcon, setProjectIcon] = useState('📌');
  const [projectColor, setProjectColor] = useState('#2563eb');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<ProjectItemDTO | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('');
  const [editColor, setEditColor] = useState('');

  const normalizedProjectName = useMemo(() => projectName.trim(), [projectName]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.key && p.key.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  function reloadProjects() {
    void refetch();
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!normalizedProjectName) {
      setCreateError('Tên dự án là bắt buộc');
      return;
    }

    setCreateError(null);

    try {
      const description = projectDescription.trim();
      const icon = projectIcon.trim();
      const color = projectColor.trim();

      await createProjectMutation.mutateAsync({
        name: normalizedProjectName,
        ...(description ? { description } : {}),
        ...(icon ? { icon } : {}),
        ...(color ? { color } : {}),
      });

      setProjectName('');
      setProjectDescription('');
      setProjectIcon('📌');
      setProjectColor('#2563eb');
      setShowCreatePanel(false);
    } catch (caughtError) {
      setCreateError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo dự án');
    }
  }

  function openEditProject(project: ProjectItemDTO) {
    setEditingProject(project);
    setEditName(project.name);
    setEditDescription(project.description ?? '');
    setEditIcon(project.icon ?? '📌');
    setEditColor(project.color ?? '#2563eb');
    setEditError(null);
  }

  function closeEditProject() {
    setEditingProject(null);
    setEditName('');
    setEditDescription('');
    setEditIcon('');
    setEditColor('');
  }

  async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProject) return;

    const normalizedName = editName.trim();
    if (!normalizedName) {
      setEditError('Tên dự án là bắt buộc');
      return;
    }

    setEditError(null);

    try {
      await updateProjectMutation.mutateAsync({
        id: editingProject.id,
        data: {
          name: normalizedName,
          description: editDescription.trim(),
          icon: editIcon.trim(),
          color: editColor.trim(),
        },
      });
      closeEditProject();
    } catch (caughtError) {
      setEditError(caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật dự án');
    }
  }

  async function handleArchiveProject(projectId: string) {
    if (!confirm('Bạn chắc chắn muốn lưu trữ dự án này?')) return;

    setArchiveError(null);

    try {
      await deleteProjectMutation.mutateAsync(projectId);
    } catch (caughtError) {
      setArchiveError(
        caughtError instanceof Error ? caughtError.message : 'Không thể lưu trữ dự án',
      );
    }
  }

  function isArchivingProject(projectId: string): boolean {
    return deleteProjectMutation.isPending && deleteProjectMutation.variables === projectId;
  }

  return {
    projectsLoading,
    projectsError,
    filteredProjects,
    reloadProjects,
    searchQuery,
    setSearchQuery,
    showCreatePanel,
    setShowCreatePanel,
    projectName,
    setProjectName,
    projectDescription,
    setProjectDescription,
    projectIcon,
    setProjectIcon,
    projectColor,
    setProjectColor,
    createError,
    handleCreateProject,
    createProjectPending: createProjectMutation.isPending,
    editingProject,
    openEditProject,
    closeEditProject,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editIcon,
    setEditIcon,
    editColor,
    setEditColor,
    editError,
    handleUpdateProject,
    updateProjectPending: updateProjectMutation.isPending,
    archiveError,
    handleArchiveProject,
    isArchivingProject,
  };
}

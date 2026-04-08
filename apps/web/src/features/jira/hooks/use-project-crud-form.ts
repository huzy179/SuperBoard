import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import type { ProjectItemDTO } from '@superboard/shared';
import {
  useCreateProject,
  useArchiveProject,
  useUpdateProject,
} from '@/features/jira/hooks/project-mutation-core';

export function useProjectCrudForm() {
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const archiveProjectMutation = useArchiveProject();

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

      toast.success('Tạo dự án thành công!');
      setProjectName('');
      setProjectDescription('');
      setProjectIcon('📌');
      setProjectColor('#2563eb');
      setShowCreatePanel(false);
    } catch (caughtError) {
      setCreateError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo dự án');
      toast.error('Không thể tạo dự án');
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
      toast.success('Cập nhật dự án thành công!');
      closeEditProject();
    } catch (caughtError) {
      setEditError(caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật dự án');
      toast.error('Không thể cập nhật dự án');
    }
  }

  async function handleArchiveProject(projectId: string) {
    if (!confirm('Bạn chắc chắn muốn lưu trữ dự án này?')) return;

    setArchiveError(null);

    try {
      await archiveProjectMutation.mutateAsync(projectId);
      toast.success('Lưu trữ dự án thành công!');
    } catch (caughtError) {
      setArchiveError(
        caughtError instanceof Error ? caughtError.message : 'Không thể lưu trữ dự án',
      );
      toast.error('Không thể lưu trữ dự án');
    }
  }

  function isArchivingProject(projectId: string): boolean {
    return archiveProjectMutation.isPending && archiveProjectMutation.variables === projectId;
  }

  return {
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

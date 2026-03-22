import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { useProjects } from '@/hooks/use-projects';
import {
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
} from '@/hooks/use-project-mutations';
import {
  FAVORITE_PROJECT_IDS_KEY,
  LAST_PROJECT_QUERY_KEY,
  LAST_PROJECT_VIEW_KEY,
} from '@/lib/constants/project';
import type { ViewMode } from '@/stores/jira-project-ui-store';

export type JiraProjectSortKey = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

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
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [sortKey, setSortKey] = useState<JiraProjectSortKey>('updated_desc');
  const [projectLastViews, setProjectLastViews] = useState<Record<string, ViewMode>>({});
  const [projectLastQueries, setProjectLastQueries] = useState<Record<string, string>>({});

  const normalizedProjectName = useMemo(() => projectName.trim(), [projectName]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(FAVORITE_PROJECT_IDS_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as string[];
      if (Array.isArray(parsed)) {
        setFavoriteProjectIds(new Set(parsed.filter((item) => typeof item === 'string')));
      }
    } catch {
      setFavoriteProjectIds(new Set());
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(FAVORITE_PROJECT_IDS_KEY, JSON.stringify([...favoriteProjectIds]));
  }, [favoriteProjectIds]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(LAST_PROJECT_VIEW_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, ViewMode>;
      if (parsed && typeof parsed === 'object') {
        setProjectLastViews(parsed);
      }
    } catch {
      setProjectLastViews({});
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const raw = window.localStorage.getItem(LAST_PROJECT_QUERY_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed && typeof parsed === 'object') {
        setProjectLastQueries(parsed);
      }
    } catch {
      setProjectLastQueries({});
    }
  }, []);

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

  const favoriteFilteredProjects = useMemo(() => {
    if (!showOnlyFavorites) {
      return filteredProjects;
    }

    return filteredProjects.filter((project) => favoriteProjectIds.has(project.id));
  }, [favoriteProjectIds, filteredProjects, showOnlyFavorites]);

  const sortedProjects = useMemo(() => {
    return [...favoriteFilteredProjects].sort((first, second) => {
      const firstFavorite = favoriteProjectIds.has(first.id);
      const secondFavorite = favoriteProjectIds.has(second.id);

      if (firstFavorite !== secondFavorite) {
        return firstFavorite ? -1 : 1;
      }

      if (sortKey === 'updated_asc') {
        return new Date(first.updatedAt).getTime() - new Date(second.updatedAt).getTime();
      }

      if (sortKey === 'name_asc') {
        return first.name.localeCompare(second.name, 'vi');
      }

      if (sortKey === 'name_desc') {
        return second.name.localeCompare(first.name, 'vi');
      }

      return new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime();
    });
  }, [favoriteFilteredProjects, favoriteProjectIds, sortKey]);

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

  function toggleFavoriteProject(projectId: string) {
    setFavoriteProjectIds((previous) => {
      const next = new Set(previous);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  function isFavoriteProject(projectId: string): boolean {
    return favoriteProjectIds.has(projectId);
  }

  const favoriteCount = useMemo(() => {
    return projects.filter((project) => favoriteProjectIds.has(project.id)).length;
  }, [favoriteProjectIds, projects]);

  const projectsUpdatedToday = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return sortedProjects.filter(
      (project) => new Date(project.updatedAt).getTime() >= startOfToday,
    );
  }, [sortedProjects]);

  const projectsUpdatedEarlier = useMemo(() => {
    const todayIds = new Set(projectsUpdatedToday.map((project) => project.id));
    return sortedProjects.filter((project) => !todayIds.has(project.id));
  }, [projectsUpdatedToday, sortedProjects]);

  const rememberedContextCount = useMemo(() => {
    const projectIds = new Set([
      ...Object.keys(projectLastViews),
      ...Object.keys(projectLastQueries),
    ]);
    let count = 0;

    projectIds.forEach((projectId) => {
      if (
        Boolean(projectLastQueries[projectId]?.trim()) ||
        Boolean(projectLastViews[projectId] && projectLastViews[projectId] !== 'board')
      ) {
        count += 1;
      }
    });

    return count;
  }, [projectLastQueries, projectLastViews]);

  function getProjectOpenHref(projectId: string): string {
    const lastQuery = projectLastQueries[projectId]?.trim();
    if (lastQuery) {
      return `/jira/projects/${projectId}?${lastQuery}`;
    }

    const lastView = projectLastViews[projectId];
    if (lastView && lastView !== 'board') {
      return `/jira/projects/${projectId}?view=${lastView}`;
    }

    return `/jira/projects/${projectId}`;
  }

  function hasRememberedContext(projectId: string): boolean {
    const hasQuery = Boolean(projectLastQueries[projectId]?.trim());
    const hasView = Boolean(projectLastViews[projectId] && projectLastViews[projectId] !== 'board');
    return hasQuery || hasView;
  }

  function clearProjectRememberedContext(projectId: string) {
    setProjectLastQueries((previous) => {
      if (!(projectId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[projectId];

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_PROJECT_QUERY_KEY, JSON.stringify(next));
      }

      return next;
    });

    setProjectLastViews((previous) => {
      if (!(projectId in previous)) {
        return previous;
      }

      const next = { ...previous };
      delete next[projectId];

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LAST_PROJECT_VIEW_KEY, JSON.stringify(next));
      }

      return next;
    });
  }

  function clearAllRememberedContexts() {
    setProjectLastQueries({});
    setProjectLastViews({});

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(LAST_PROJECT_QUERY_KEY);
      window.localStorage.removeItem(LAST_PROJECT_VIEW_KEY);
    }
  }

  return {
    projectsLoading,
    projectsError,
    filteredProjects: sortedProjects,
    reloadProjects,
    searchQuery,
    setSearchQuery,
    showOnlyFavorites,
    setShowOnlyFavorites,
    sortKey,
    setSortKey,
    favoriteCount,
    rememberedContextCount,
    projectsUpdatedToday,
    projectsUpdatedEarlier,
    getProjectOpenHref,
    hasRememberedContext,
    clearProjectRememberedContext,
    clearAllRememberedContexts,
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
    toggleFavoriteProject,
    isFavoriteProject,
  };
}

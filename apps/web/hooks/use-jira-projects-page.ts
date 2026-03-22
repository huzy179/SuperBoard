import { useMemo, useState } from 'react';
import { useProjects } from '@/hooks/use-projects';
import { useProjectContextMemory } from '@/hooks/use-project-context-memory';
import { useProjectCrudForm } from '@/hooks/use-project-crud-form';
import { useProjectFavorites } from '@/hooks/use-project-favorites';

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

  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<JiraProjectSortKey>('updated_desc');

  const {
    favoriteProjectIds,
    showOnlyFavorites,
    setShowOnlyFavorites,
    toggleFavoriteProject,
    isFavoriteProject,
    favoriteCount,
  } = useProjectFavorites(projects);

  const {
    rememberedContextCount,
    getProjectOpenHref,
    hasRememberedContext,
    clearProjectRememberedContext,
    clearAllRememberedContexts,
  } = useProjectContextMemory();

  const {
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
    createProjectPending,
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
    updateProjectPending,
    archiveError,
    handleArchiveProject,
    isArchivingProject,
  } = useProjectCrudForm();

  const searchedProjects = useMemo(() => {
    if (!searchQuery.trim()) {
      return projects;
    }

    const q = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(q) ||
        (project.key && project.key.toLowerCase().includes(q)) ||
        (project.description && project.description.toLowerCase().includes(q)),
    );
  }, [projects, searchQuery]);

  const visibleProjects = useMemo(() => {
    if (!showOnlyFavorites) {
      return searchedProjects;
    }

    return searchedProjects.filter((project) => favoriteProjectIds.has(project.id));
  }, [favoriteProjectIds, searchedProjects, showOnlyFavorites]);

  const sortedProjects = useMemo(() => {
    return [...visibleProjects].sort((first, second) => {
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
  }, [favoriteProjectIds, sortKey, visibleProjects]);

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

  function reloadProjects() {
    void refetch();
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
    createProjectPending,
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
    updateProjectPending,
    archiveError,
    handleArchiveProject,
    isArchivingProject,
    toggleFavoriteProject,
    isFavoriteProject,
  };
}

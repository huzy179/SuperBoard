import { useMemo, useState } from 'react';
import {
  useProjects,
  useProjectContextMemory,
  useProjectCrudForm,
  useProjectFavorites,
} from '@/features/jira/hooks/project-core';
import {
  filterProjectsByQuery,
  sortProjectsWithFavorites,
  splitProjectsByUpdatedToday,
} from '@/lib/helpers/jira-projects-page';

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
    return filterProjectsByQuery(projects, searchQuery);
  }, [projects, searchQuery]);

  const visibleProjects = useMemo(() => {
    if (!showOnlyFavorites) {
      return searchedProjects;
    }

    return searchedProjects.filter((project) => favoriteProjectIds.has(project.id));
  }, [favoriteProjectIds, searchedProjects, showOnlyFavorites]);

  const sortedProjects = useMemo(() => {
    return sortProjectsWithFavorites(visibleProjects, favoriteProjectIds, sortKey);
  }, [favoriteProjectIds, sortKey, visibleProjects]);

  const { projectsUpdatedToday, projectsUpdatedEarlier } = useMemo(
    () => splitProjectsByUpdatedToday(sortedProjects),
    [sortedProjects],
  );

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

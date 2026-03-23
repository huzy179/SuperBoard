import type { ProjectItemDTO } from '@superboard/shared';

type JiraProjectsSortKey = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc';

export function filterProjectsByQuery(projects: ProjectItemDTO[], searchQuery: string) {
  if (!searchQuery.trim()) {
    return projects;
  }

  const normalizedQuery = searchQuery.toLowerCase();
  return projects.filter(
    (project) =>
      project.name.toLowerCase().includes(normalizedQuery) ||
      (project.key && project.key.toLowerCase().includes(normalizedQuery)) ||
      (project.description && project.description.toLowerCase().includes(normalizedQuery)),
  );
}

export function sortProjectsWithFavorites(
  projects: ProjectItemDTO[],
  favoriteProjectIds: Set<string>,
  sortKey: JiraProjectsSortKey,
) {
  return [...projects].sort((first, second) => {
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
}

export function splitProjectsByUpdatedToday(projects: ProjectItemDTO[]) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const projectsUpdatedToday = projects.filter(
    (project) => new Date(project.updatedAt).getTime() >= startOfToday,
  );

  const todayIds = new Set(projectsUpdatedToday.map((project) => project.id));
  const projectsUpdatedEarlier = projects.filter((project) => !todayIds.has(project.id));

  return {
    projectsUpdatedToday,
    projectsUpdatedEarlier,
  };
}

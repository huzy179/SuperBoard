import { useEffect, useMemo, useState } from 'react';
import type { ProjectItemDTO } from '@superboard/shared';
import { FAVORITE_PROJECT_IDS_KEY } from '@/lib/constants/project';

export function useProjectFavorites(projects: ProjectItemDTO[]) {
  const [favoriteProjectIds, setFavoriteProjectIds] = useState<Set<string>>(new Set());
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

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

  return {
    favoriteProjectIds,
    showOnlyFavorites,
    setShowOnlyFavorites,
    toggleFavoriteProject,
    isFavoriteProject,
    favoriteCount,
  };
}

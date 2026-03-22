import { useEffect, useMemo, useState } from 'react';
import { LAST_PROJECT_QUERY_KEY, LAST_PROJECT_VIEW_KEY } from '@/lib/constants/project';
import type { ViewMode } from '@/stores/jira-project-ui-store';

export function useProjectContextMemory() {
  const [projectLastViews, setProjectLastViews] = useState<Record<string, ViewMode>>({});
  const [projectLastQueries, setProjectLastQueries] = useState<Record<string, string>>({});

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
    rememberedContextCount,
    getProjectOpenHref,
    hasRememberedContext,
    clearProjectRememberedContext,
    clearAllRememberedContexts,
  };
}

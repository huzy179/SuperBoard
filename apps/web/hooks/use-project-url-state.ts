import { useEffect, useRef } from 'react';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { LAST_PROJECT_QUERY_KEY, LAST_PROJECT_VIEW_KEY } from '@/lib/constants/project';
import type { SortDirection, TaskSortBy } from '@/lib/helpers/task-view';
import type { ViewMode } from '@/stores/jira-project-ui-store';

type UrlStateOptions = {
  projectId: string;
  pathname: string;
  router: { replace: (href: string, options?: { scroll?: boolean }) => void };
  searchParams: ReadonlyURLSearchParams;
  allowedStatuses: ReadonlySet<string>;
  allowedPriorities: ReadonlySet<string>;
  allowedTypes: ReadonlySet<string>;
  viewMode: ViewMode;
  filterQuery: string;
  filterAssignee: string;
  filterStatuses: Set<string>;
  filterPriorities: Set<string>;
  filterTypes: Set<string>;
  sortBy: TaskSortBy;
  sortDir: SortDirection;
  setViewMode: (value: ViewMode) => void;
  setFilterQuery: (value: string) => void;
  setFilterAssignee: (value: string) => void;
  setFilterStatuses: (value: Set<string>) => void;
  setFilterPriorities: (value: Set<string>) => void;
  setFilterTypes: (value: Set<string>) => void;
  setSortBy: (value: TaskSortBy) => void;
  setSortDir: (value: SortDirection) => void;
  showArchived: boolean;
  setShowArchived: (value: boolean) => void;
};

function parseCsvSet(value: string | null, allowed: ReadonlySet<string>): Set<string> {
  if (!value) {
    return new Set();
  }

  const next = new Set<string>();
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      if (allowed.has(item)) {
        next.add(item);
      }
    });

  return next;
}

function serializeCsvSet(value: Set<string>): string {
  return [...value].sort().join(',');
}

function parseViewMode(value: string | null): ViewMode {
  if (value === 'list') {
    return 'list';
  }
  if (value === 'calendar') {
    return 'calendar';
  }
  return 'board';
}

function parseTaskSortBy(value: string | null): TaskSortBy {
  if (
    value === 'dueDate' ||
    value === 'createdAt' ||
    value === 'priority' ||
    value === 'storyPoints'
  ) {
    return value;
  }
  return '';
}

function parseSortDirection(value: string | null): SortDirection {
  return value === 'desc' ? 'desc' : 'asc';
}

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }

  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }

  return true;
}

export function useProjectUrlState(options: UrlStateOptions) {
  const isApplyingUrlStateRef = useRef(false);

  useEffect(() => {
    const nextViewMode = parseViewMode(options.searchParams.get('view'));
    const nextQuery = options.searchParams.get('q') ?? '';
    const nextAssignee = options.searchParams.get('assignee') ?? '';
    const nextStatuses = parseCsvSet(options.searchParams.get('statuses'), options.allowedStatuses);
    const nextPriorities = parseCsvSet(
      options.searchParams.get('priorities'),
      options.allowedPriorities,
    );
    const nextTypes = parseCsvSet(options.searchParams.get('types'), options.allowedTypes);
    const nextSortBy = parseTaskSortBy(options.searchParams.get('sortBy'));
    const nextSortDir = parseSortDirection(options.searchParams.get('sortDir'));
    const nextShowArchived = options.searchParams.get('archived') === 'true';

    let changed = false;

    if (options.viewMode !== nextViewMode) {
      changed = true;
      options.setViewMode(nextViewMode);
    }
    if (options.filterQuery !== nextQuery) {
      changed = true;
      options.setFilterQuery(nextQuery);
    }
    if (options.filterAssignee !== nextAssignee) {
      changed = true;
      options.setFilterAssignee(nextAssignee);
    }
    if (!areSetsEqual(options.filterStatuses, nextStatuses)) {
      changed = true;
      options.setFilterStatuses(nextStatuses);
    }
    if (!areSetsEqual(options.filterPriorities, nextPriorities)) {
      changed = true;
      options.setFilterPriorities(nextPriorities);
    }
    if (!areSetsEqual(options.filterTypes, nextTypes)) {
      changed = true;
      options.setFilterTypes(nextTypes);
    }
    if (options.sortBy !== nextSortBy) {
      changed = true;
      options.setSortBy(nextSortBy);
    }
    if (options.sortDir !== nextSortDir) {
      changed = true;
      options.setSortDir(nextSortDir);
    }
    if (options.showArchived !== nextShowArchived) {
      changed = true;
      options.setShowArchived(nextShowArchived);
    }

    if (changed) {
      isApplyingUrlStateRef.current = true;
    }
  }, [
    options.searchParams,
    options.allowedStatuses,
    options.allowedPriorities,
    options.allowedTypes,
    options.viewMode,
    options.filterQuery,
    options.filterAssignee,
    options.filterStatuses,
    options.filterPriorities,
    options.filterTypes,
    options.sortBy,
    options.sortDir,
    options.setViewMode,
    options.setFilterQuery,
    options.setFilterAssignee,
    options.setFilterStatuses,
    options.setFilterPriorities,
    options.setFilterTypes,
    options.setSortBy,
    options.setSortDir,
    options.showArchived,
    options.setShowArchived,
  ]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) {
      isApplyingUrlStateRef.current = false;
      return;
    }

    const nextParams = new URLSearchParams(options.searchParams.toString());

    if (options.viewMode === 'board') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', options.viewMode);
    }

    const normalizedQuery = options.filterQuery.trim();
    if (!normalizedQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', normalizedQuery);
    }

    if (!options.filterAssignee) {
      nextParams.delete('assignee');
    } else {
      nextParams.set('assignee', options.filterAssignee);
    }

    const statusesValue = serializeCsvSet(options.filterStatuses);
    if (!statusesValue) {
      nextParams.delete('statuses');
    } else {
      nextParams.set('statuses', statusesValue);
    }

    const prioritiesValue = serializeCsvSet(options.filterPriorities);
    if (!prioritiesValue) {
      nextParams.delete('priorities');
    } else {
      nextParams.set('priorities', prioritiesValue);
    }

    const typesValue = serializeCsvSet(options.filterTypes);
    if (!typesValue) {
      nextParams.delete('types');
    } else {
      nextParams.set('types', typesValue);
    }

    if (!options.sortBy) {
      nextParams.delete('sortBy');
      nextParams.delete('sortDir');
    } else {
      nextParams.set('sortBy', options.sortBy);
      nextParams.set('sortDir', options.sortDir);
    }

    if (!options.showArchived) {
      nextParams.delete('archived');
    } else {
      nextParams.set('archived', 'true');
    }

    const nextQuery = nextParams.toString();
    const currentQuery = options.searchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextUrl = nextQuery ? `${options.pathname}?${nextQuery}` : options.pathname;
      options.router.replace(nextUrl, { scroll: false });
    }
  }, [
    options.viewMode,
    options.filterQuery,
    options.filterAssignee,
    options.filterStatuses,
    options.filterPriorities,
    options.filterTypes,
    options.sortBy,
    options.sortDir,
    options.showArchived,
    options.pathname,
    options.router,
    options.searchParams,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined' || !options.projectId) {
      return;
    }

    try {
      const currentQuery = options.searchParams.toString();

      const raw = window.localStorage.getItem(LAST_PROJECT_VIEW_KEY);
      const current = raw ? (JSON.parse(raw) as Record<string, ViewMode>) : {};
      const nextViews = {
        ...current,
        [options.projectId]: options.viewMode,
      };
      window.localStorage.setItem(LAST_PROJECT_VIEW_KEY, JSON.stringify(nextViews));

      const rawQueries = window.localStorage.getItem(LAST_PROJECT_QUERY_KEY);
      const currentQueries = rawQueries ? (JSON.parse(rawQueries) as Record<string, string>) : {};
      const nextQueries = {
        ...currentQueries,
        [options.projectId]: currentQuery,
      };
      window.localStorage.setItem(LAST_PROJECT_QUERY_KEY, JSON.stringify(nextQueries));
    } catch {
      // ignore localStorage parse/write errors
    }
  }, [options.projectId, options.viewMode, options.searchParams]);
}

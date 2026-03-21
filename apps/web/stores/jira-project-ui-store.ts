import { create } from 'zustand';

import type { SortDirection, TaskSortBy } from '@/lib/helpers/task-view';

type ViewMode = 'board' | 'list';

type StateUpdater<T> = T | ((prev: T) => T);

function resolveNextState<T>(prev: T, updater: StateUpdater<T>): T {
  return typeof updater === 'function' ? (updater as (value: T) => T)(prev) : updater;
}

type JiraProjectUiState = {
  viewMode: ViewMode;
  showCreateTaskPanel: boolean;
  filterAssignee: string;
  filterQuery: string;
  filterStatuses: Set<string>;
  filterPriorities: Set<string>;
  filterTypes: Set<string>;
  sortBy: TaskSortBy;
  sortDir: SortDirection;
  setViewMode: (value: StateUpdater<ViewMode>) => void;
  setShowCreateTaskPanel: (value: StateUpdater<boolean>) => void;
  setFilterAssignee: (value: StateUpdater<string>) => void;
  setFilterQuery: (value: StateUpdater<string>) => void;
  setFilterStatuses: (value: StateUpdater<Set<string>>) => void;
  setFilterPriorities: (value: StateUpdater<Set<string>>) => void;
  setFilterTypes: (value: StateUpdater<Set<string>>) => void;
  setSortBy: (value: StateUpdater<TaskSortBy>) => void;
  setSortDir: (value: StateUpdater<SortDirection>) => void;
  resetUiState: () => void;
};

const initialUiState = {
  viewMode: 'board' as ViewMode,
  showCreateTaskPanel: false,
  filterAssignee: '',
  filterQuery: '',
  filterStatuses: new Set<string>(),
  filterPriorities: new Set<string>(),
  filterTypes: new Set<string>(),
  sortBy: '' as TaskSortBy,
  sortDir: 'asc' as SortDirection,
};

export const useJiraProjectUiStore = create<JiraProjectUiState>((set) => ({
  ...initialUiState,
  setViewMode: (value) =>
    set((state) => ({
      viewMode: resolveNextState(state.viewMode, value),
    })),
  setShowCreateTaskPanel: (value) =>
    set((state) => ({
      showCreateTaskPanel: resolveNextState(state.showCreateTaskPanel, value),
    })),
  setFilterAssignee: (value) =>
    set((state) => ({
      filterAssignee: resolveNextState(state.filterAssignee, value),
    })),
  setFilterQuery: (value) =>
    set((state) => ({
      filterQuery: resolveNextState(state.filterQuery, value),
    })),
  setFilterStatuses: (value) =>
    set((state) => ({
      filterStatuses: resolveNextState(state.filterStatuses, value),
    })),
  setFilterPriorities: (value) =>
    set((state) => ({
      filterPriorities: resolveNextState(state.filterPriorities, value),
    })),
  setFilterTypes: (value) =>
    set((state) => ({
      filterTypes: resolveNextState(state.filterTypes, value),
    })),
  setSortBy: (value) =>
    set((state) => ({
      sortBy: resolveNextState(state.sortBy, value),
    })),
  setSortDir: (value) =>
    set((state) => ({
      sortDir: resolveNextState(state.sortDir, value),
    })),
  resetUiState: () =>
    set(() => ({
      ...initialUiState,
      filterStatuses: new Set<string>(),
      filterPriorities: new Set<string>(),
      filterTypes: new Set<string>(),
    })),
}));

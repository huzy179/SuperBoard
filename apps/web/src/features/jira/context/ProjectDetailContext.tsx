'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { ViewMode } from '@/stores/jira-project-ui-store';
import type { TaskSortBy, SortDirection } from '@/lib/helpers/task-view';
import { toggleSetFilterValue } from '@/lib/helpers/task-view';
import type { ProjectTaskItemDTO } from '@superboard/shared';

interface ProjectDetailContextType {
  // View Modes
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Panel States
  showCreateTaskPanel: boolean;
  setShowCreateTaskPanel: (show: boolean) => void;
  taskStatus: ProjectTaskItemDTO['status'] | undefined;
  setTaskStatus: (status: ProjectTaskItemDTO['status'] | undefined) => void;
  showAutomationPanel: boolean;
  setShowAutomationPanel: (show: boolean) => void;
  showKnowledgeMap: boolean;
  setShowKnowledgeMap: (show: boolean) => void;
  showQuickSearch: boolean;
  setShowQuickSearch: (show: boolean) => void;

  // Filters
  filterQuery: string;
  setFilterQuery: (query: string) => void;
  filterAssignee: string;
  setFilterAssignee: (assigneeId: string) => void;
  filterStatuses: Set<string>;
  setFilterStatuses: (statuses: Set<string>) => void;
  filterPriorities: Set<string>;
  setFilterPriorities: (priorities: Set<string>) => void;
  filterTypes: Set<string>;
  setFilterTypes: (types: Set<string>) => void;

  // Sorting
  sortBy: TaskSortBy;
  setSortBy: (field: TaskSortBy) => void;
  sortDir: SortDirection;
  setSortDir: (dir: SortDirection) => void;

  // Archived Toggle
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;

  // Helpers
  resetFilters: () => void;
  toggleFilter: (key: 'status' | 'priority' | 'type', value: string) => void;
}

const ProjectDetailContext = createContext<ProjectDetailContextType | undefined>(undefined);

export function ProjectDetailProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showCreateTaskPanel, setShowCreateTaskPanel] = useState(false);
  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status'] | undefined>();
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);
  const [showKnowledgeMap, setShowKnowledgeMap] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const [filterQuery, setFilterQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<TaskSortBy>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const resetFilters = useCallback(() => {
    setFilterQuery('');
    setFilterAssignee('');
    setFilterStatuses(new Set());
    setFilterPriorities(new Set());
    setFilterTypes(new Set());
    setSortBy('');
    setSortDir('asc');
  }, []);

  const toggleFilter = useCallback(
    (key: 'status' | 'priority' | 'type', value: string) => {
      const setters = {
        status: { current: filterStatuses, setter: setFilterStatuses },
        priority: { current: filterPriorities, setter: setFilterPriorities },
        type: { current: filterTypes, setter: setFilterTypes },
      };
      const { current, setter } = setters[key];
      setter(toggleSetFilterValue(new Set(current), value));
    },
    [filterStatuses, filterPriorities, filterTypes],
  );

  const value = useMemo(
    () => ({
      viewMode,
      setViewMode,
      showCreateTaskPanel,
      setShowCreateTaskPanel,
      taskStatus,
      setTaskStatus,
      showAutomationPanel,
      setShowAutomationPanel,
      showKnowledgeMap,
      setShowKnowledgeMap,
      showQuickSearch,
      setShowQuickSearch,
      filterQuery,
      setFilterQuery,
      filterAssignee,
      setFilterAssignee,
      filterStatuses,
      setFilterStatuses,
      filterPriorities,
      setFilterPriorities,
      filterTypes,
      setFilterTypes,
      sortBy,
      setSortBy,
      sortDir,
      setSortDir,
      showArchived,
      setShowArchived,
      resetFilters,
      toggleFilter,
    }),
    [
      viewMode,
      showCreateTaskPanel,
      taskStatus,
      showAutomationPanel,
      showKnowledgeMap,
      showQuickSearch,
      filterQuery,
      filterAssignee,
      filterStatuses,
      filterPriorities,
      filterTypes,
      sortBy,
      sortDir,
      showArchived,
      resetFilters,
      toggleFilter,
    ],
  );

  return <ProjectDetailContext.Provider value={value}>{children}</ProjectDetailContext.Provider>;
}

export function useProjectDetailContext() {
  const context = useContext(ProjectDetailContext);
  if (context === undefined) {
    throw new Error('useProjectDetailContext must be used within a ProjectDetailProvider');
  }
  return context;
}

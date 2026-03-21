import type { ProjectTaskItemDTO } from '@superboard/shared';

import { PRIORITY_SORT_ORDER } from '@/lib/constants/task';

export type TaskSortBy = '' | 'dueDate' | 'createdAt' | 'priority' | 'storyPoints';
export type SortDirection = 'asc' | 'desc';

type TaskFilterOptions = {
  query: string;
  assigneeId: string;
  statuses: Set<string>;
  priorities: Set<string>;
  types: Set<string>;
  sortBy: TaskSortBy;
  sortDir: SortDirection;
};

export function toggleSetFilterValue(prev: Set<string>, value: string): Set<string> {
  const next = new Set(prev);
  if (next.has(value)) {
    next.delete(value);
  } else {
    next.add(value);
  }
  return next;
}

export function filterAndSortProjectTasks(
  tasks: ProjectTaskItemDTO[],
  options: TaskFilterOptions,
): ProjectTaskItemDTO[] {
  const { query, assigneeId, statuses, priorities, types, sortBy, sortDir } = options;

  let nextTasks = tasks;
  const normalizedQuery = query.trim().toLowerCase();
  if (normalizedQuery) {
    nextTasks = nextTasks.filter((task) => {
      const taskCode = task.number != null ? String(task.number) : '';
      return (
        task.title.toLowerCase().includes(normalizedQuery) ||
        (task.description ?? '').toLowerCase().includes(normalizedQuery) ||
        taskCode.includes(normalizedQuery)
      );
    });
  }
  if (assigneeId) {
    nextTasks = nextTasks.filter((task) => task.assigneeId === assigneeId);
  }
  if (statuses.size > 0) {
    nextTasks = nextTasks.filter((task) => statuses.has(task.status));
  }
  if (priorities.size > 0) {
    nextTasks = nextTasks.filter((task) => priorities.has(task.priority));
  }
  if (types.size > 0) {
    nextTasks = nextTasks.filter((task) => types.has(task.type ?? 'task'));
  }

  if (!sortBy) {
    return nextTasks;
  }

  const sortedTasks = [...nextTasks].sort((a, b) => {
    let compareValue = 0;
    if (sortBy === 'dueDate') {
      const dueDateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dueDateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      compareValue = dueDateA - dueDateB;
    } else if (sortBy === 'createdAt') {
      compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortBy === 'priority') {
      compareValue =
        (PRIORITY_SORT_ORDER[a.priority] ?? 2) - (PRIORITY_SORT_ORDER[b.priority] ?? 2);
    } else if (sortBy === 'storyPoints') {
      compareValue = (a.storyPoints ?? 0) - (b.storyPoints ?? 0);
    }
    return sortDir === 'desc' ? -compareValue : compareValue;
  });

  return sortedTasks;
}

export function buildBoardData(
  tasks: ProjectTaskItemDTO[],
  statuses: readonly ProjectTaskItemDTO['status'][],
): Map<ProjectTaskItemDTO['status'], ProjectTaskItemDTO[]> {
  const byStatus = new Map<ProjectTaskItemDTO['status'], ProjectTaskItemDTO[]>();
  statuses.forEach((status) => {
    byStatus.set(status, []);
  });

  tasks.forEach((task) => {
    const current = byStatus.get(task.status) ?? [];
    byStatus.set(task.status, [...current, task]);
  });

  return byStatus;
}

export function isTaskOverdue(dueDate?: string | null): boolean {
  if (!dueDate) {
    return false;
  }
  return new Date(dueDate) < new Date();
}

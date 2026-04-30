/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import type { ProjectMemberDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import { ArrowUpDown, RotateCcw, Search } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { useProjectDetailContext } from '@/features/operations/project/context/ProjectDetailContext';
import type { TaskSortBy } from '@/features/operations/task/utils/task-view';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';

type TaskFilterBarProps = {
  members: ProjectMemberDTO[];
  workflow?: WorkflowStatusTemplateDTO | undefined;
};

export function TaskFilterBar({ members, workflow }: TaskFilterBarProps) {
  const {
    filterQuery,
    setFilterQuery,
    filterAssignee,
    setFilterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    setSortBy,
    sortDir,
    setSortDir,
    showArchived,
    setShowArchived,
    resetFilters,
    toggleFilter,
  } = useProjectDetailContext();

  const hasActiveFilters =
    filterStatuses.size > 0 ||
    filterPriorities.size > 0 ||
    filterTypes.size > 0 ||
    !!filterAssignee ||
    !!filterQuery ||
    showArchived;

  return (
    <section className="mb-8 rounded-lg border border-surface-border bg-surface-card shadow-luxe p-[var(--space-6)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-brand-500" />
          <p className="text-sm font-semibold text-[color:var(--color-ink)]">Bộ lọc</p>
          {hasActiveFilters ? (
            <span className="text-xs font-medium text-[color:var(--color-muted)]">
              (đang áp dụng)
            </span>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <AppButton
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<RotateCcw size={14} />}
            onClick={resetFilters}
          >
            Reset
          </AppButton>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-faint)]"
            />
            <input
              type="text"
              value={filterQuery}
              onChange={(event) => setFilterQuery(event.target.value)}
              placeholder="Tìm task…"
              className="form-input pl-9"
              aria-label="Search tasks"
            />
          </div>

          <select
            value={filterAssignee}
            onChange={(event) => setFilterAssignee(event.target.value)}
            className="form-select md:max-w-xs"
            aria-label="Assignee"
          >
            <option value="">Assignee (all)</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 md:ml-auto">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as TaskSortBy)}
              className="form-select"
              aria-label="Sort by"
            >
              <option value="">Sort (default)</option>
              <option value="dueDate">Due date</option>
              <option value="createdAt">Created</option>
              <option value="priority">Priority</option>
              <option value="storyPoints">Story points</option>
            </select>
            <button
              type="button"
              disabled={!sortBy}
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] disabled:opacity-40"
              title="Toggle sort direction"
            >
              <ArrowUpDown size={16} />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[color:var(--color-muted)] mr-1">
              Status:
            </span>
            {(workflow?.statuses || BOARD_COLUMNS).map((s: any) => {
              const key = s.key;
              const label = s.name || s.label;
              const isActive = filterStatuses.has(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleFilter('status', key)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 border-brand-500/25 text-brand-700'
                      : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[color:var(--color-muted)] mr-1">
              Priority:
            </span>
            {PRIORITY_OPTIONS.map((priority) => {
              const isActive = filterPriorities.has(priority.key);
              return (
                <button
                  key={priority.key}
                  type="button"
                  onClick={() => toggleFilter('priority', priority.key)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 border-brand-500/25 text-brand-700'
                      : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                  }`}
                >
                  {priority.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-[color:var(--color-muted)] mr-1">
              Type:
            </span>
            {TASK_TYPE_OPTIONS.map((taskType) => {
              const isActive = filterTypes.has(taskType.key);
              return (
                <button
                  key={taskType.key}
                  type="button"
                  onClick={() => toggleFilter('type', taskType.key)}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-brand-50 border-brand-500/25 text-brand-700'
                      : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                  }`}
                >
                  {taskType.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-2 rounded-sm border px-3 py-2 text-xs font-semibold transition-colors ${
              showArchived
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-surface-bg border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
            }`}
          >
            {showArchived ? 'Đang xem archived' : 'Ẩn archived'}
          </button>
          <div className="text-xs text-[color:var(--color-faint)]">
            Mẹo: giữ <span className="font-semibold">Ctrl/⌘</span> để chọn nhiều task.
          </div>
        </div>
      </div>
    </section>
  );
}

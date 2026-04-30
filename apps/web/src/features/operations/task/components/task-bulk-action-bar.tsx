'use client';

import type { ProjectMemberDTO, ProjectTaskItemDTO, TaskPriorityDTO } from '@superboard/shared';
import { CheckSquare, Loader2, Trash2, X } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { BOARD_COLUMNS, PRIORITY_OPTIONS } from '@/lib/constants/task';

type TaskBulkActionBarProps = {
  members: ProjectMemberDTO[];
  selectedCount: number;
  selectedVisibleCount: number;
  totalVisibleCount: number;
  bulkStatus: ProjectTaskItemDTO['status'];
  bulkPriority: TaskPriorityDTO;
  bulkAssigneeId: string;
  isStatusPending: boolean;
  isPriorityPending: boolean;
  isAssignPending: boolean;
  isDeletePending: boolean;
  onBulkStatusChange: (value: ProjectTaskItemDTO['status']) => void;
  onBulkPriorityChange: (value: TaskPriorityDTO) => void;
  onBulkAssigneeIdChange: (value: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onApplyStatus: () => void;
  onApplyPriority: () => void;
  onApplyAssignee: () => void;
  onDeleteSelected: () => void;
  workflow?:
    | {
        statuses: { key: string; label?: string; name?: string }[];
      }
    | undefined;
};

export function TaskBulkActionBar(props: TaskBulkActionBarProps) {
  const {
    members,
    selectedCount,
    selectedVisibleCount,
    totalVisibleCount,
    bulkStatus,
    bulkPriority,
    bulkAssigneeId,
    isStatusPending,
    isPriorityPending,
    isAssignPending,
    isDeletePending,
    onBulkStatusChange,
    onBulkPriorityChange,
    onBulkAssigneeIdChange,
    onToggleSelectAllVisible,
    onClearSelection,
    onApplyStatus,
    onApplyPriority,
    onApplyAssignee,
    onDeleteSelected,
    workflow,
  } = props;

  if (selectedCount === 0) return null;

  const statuses = workflow?.statuses?.length ? workflow.statuses : BOARD_COLUMNS;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-5xl px-4">
      <div className="rounded-lg border border-surface-border bg-surface-card shadow-glass p-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full border border-surface-border bg-black/[0.03] px-3 py-1 text-xs font-semibold text-[color:var(--color-muted)]">
              Selected: <span className="ml-1 text-[color:var(--color-ink)]">{selectedCount}</span>
            </span>
            <span className="text-xs text-[color:var(--color-faint)]">
              Visible: {selectedVisibleCount}/{totalVisibleCount}
            </span>
            <button
              type="button"
              onClick={onClearSelection}
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-transparent text-[color:var(--color-muted)] hover:bg-black/[0.04] hover:text-[color:var(--color-ink)]"
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <select
                value={bulkStatus}
                onChange={(e) => onBulkStatusChange(e.target.value as ProjectTaskItemDTO['status'])}
                className="form-select"
                aria-label="Bulk status"
              >
                {statuses.map((s) => {
                  const label = 'name' in s ? (s.name ?? s.label ?? s.key) : (s.label ?? s.key);
                  return (
                    <option key={s.key} value={s.key}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isStatusPending}
                onClick={onApplyStatus}
              >
                Apply
              </AppButton>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkPriority}
                onChange={(e) => onBulkPriorityChange(e.target.value as TaskPriorityDTO)}
                className="form-select"
                aria-label="Bulk priority"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
              </select>
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isPriorityPending}
                onClick={onApplyPriority}
              >
                Apply
              </AppButton>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkAssigneeId}
                onChange={(e) => onBulkAssigneeIdChange(e.target.value)}
                className="form-select"
                aria-label="Bulk assignee"
              >
                <option value="">Assignee (none)</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                isLoading={isAssignPending}
                onClick={onApplyAssignee}
              >
                Apply
              </AppButton>
            </div>

            <button
              type="button"
              onClick={onToggleSelectAllVisible}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]"
              title="Toggle select all visible"
            >
              <CheckSquare size={16} />
            </button>

            <button
              type="button"
              onClick={onDeleteSelected}
              disabled={isDeletePending}
              className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-40"
              title="Delete selected"
            >
              {isDeletePending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Trash2 size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

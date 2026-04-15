import type { ProjectMemberDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import type { SortDirection, TaskSortBy } from '@/lib/helpers/task-view';

type TaskFilterBarProps = {
  members: ProjectMemberDTO[];
  filterQuery: string;
  filterAssignee: string;
  filterStatuses: Set<string>;
  filterPriorities: Set<string>;
  filterTypes: Set<string>;
  sortBy: TaskSortBy;
  sortDir: SortDirection;
  showArchived: boolean;
  hasActiveFilters: boolean;
  onFilterQueryChange: (value: string) => void;
  onFilterAssigneeChange: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onTogglePriority: (value: string) => void;
  onToggleType: (value: string) => void;
  onSortByChange: (value: TaskSortBy) => void;
  onToggleSortDir: () => void;
  onToggleShowArchived: () => void;
  onClearFilters: () => void;
  workflow?: WorkflowStatusTemplateDTO | undefined;
};

export function TaskFilterBar({
  members,
  filterQuery,
  filterAssignee,
  filterStatuses,
  filterPriorities,
  filterTypes,
  sortBy,
  sortDir,
  showArchived,
  hasActiveFilters,
  onFilterQueryChange,
  onFilterAssigneeChange,
  onToggleStatus,
  onTogglePriority,
  onToggleType,
  onSortByChange,
  onToggleSortDir,
  onToggleShowArchived,
  onClearFilters,
  workflow,
}: TaskFilterBarProps) {
  return (
    <div className="mb-4 rounded-[1.5rem] border border-white/5 bg-slate-950/80 p-3 backdrop-blur-3xl shadow-glass">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-widest text-white/40 uppercase">
          Bộ lọc nhanh
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/10"
          >
            Xoá bộ lọc
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={filterQuery}
          onChange={(event) => onFilterQueryChange(event.target.value)}
          placeholder="Tìm task..."
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white placeholder:text-white/20 sm:w-56"
          aria-label="Tìm kiếm task"
        />

        <div className="h-5 w-px bg-white/5" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.02] px-2 py-1">
          <span className="text-[11px] text-white/40">Trạng thái</span>
          {workflow?.statuses
            ? workflow.statuses.map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => onToggleStatus(s.key)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    filterStatuses.has(s.key)
                      ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30'
                      : 'bg-slate-800 text-white/40 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {s.name}
                </button>
              ))
            : BOARD_COLUMNS.map((column) => (
                <button
                  key={column.key}
                  type="button"
                  onClick={() => onToggleStatus(column.key)}
                  className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                    filterStatuses.has(column.key)
                      ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30'
                      : 'bg-slate-800 text-white/40 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {column.label}
                </button>
              ))}
        </div>

        <div className="h-5 w-px bg-white/5" />

        <select
          value={filterAssignee}
          onChange={(event) => onFilterAssigneeChange(event.target.value)}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-white placeholder:text-white/20"
          aria-label="Lọc theo người thực hiện"
        >
          <option value="">Người thực hiện</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>

        <div className="h-5 w-px bg-white/5" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.02] px-2 py-1">
          <span className="text-[11px] text-white/40">Ưu tiên</span>
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority.key}
              type="button"
              onClick={() => onTogglePriority(priority.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filterPriorities.has(priority.key)
                  ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30'
                  : 'bg-slate-800 text-white/40 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/5" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.02] px-2 py-1">
          <span className="text-[11px] text-white/40">Loại</span>
          {TASK_TYPE_OPTIONS.map((taskType) => (
            <button
              key={taskType.key}
              type="button"
              onClick={() => onToggleType(taskType.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filterTypes.has(taskType.key)
                  ? 'bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/30'
                  : 'bg-slate-800 text-white/40 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {taskType.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-white/5" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-white/[0.02] px-2 py-1">
          <span className="text-[11px] text-white/40">Sắp xếp</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as TaskSortBy)}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-[11px] text-white"
            aria-label="Sắp xếp theo"
          >
            <option value="">Mặc định</option>
            <option value="dueDate">Hạn hoàn thành</option>
            <option value="createdAt">Ngày tạo</option>
            <option value="priority">Độ ưu tiên</option>
            <option value="storyPoints">Story Points</option>
          </select>
          {sortBy ? (
            <button
              type="button"
              onClick={onToggleSortDir}
              className="rounded-md bg-slate-800 px-2 py-1 text-[11px] font-medium text-white/40 hover:bg-slate-700 hover:text-white"
              aria-label={sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortDir === 'asc' ? '↑ Tăng' : '↓ Giảm'}
            </button>
          ) : null}
        </div>

        <div className="h-5 w-px bg-white/5" />

        <button
          type="button"
          onClick={onToggleShowArchived}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
            showArchived
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
              : 'border-white/10 bg-white/[0.03] text-white/40 hover:bg-white/[0.06]'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${showArchived ? 'bg-amber-400' : 'bg-white/20'}`}
          />
          {showArchived ? 'Đang hiện mục lưu trữ' : 'Hiện mục lưu trữ'}
        </button>
      </div>
    </div>
  );
}

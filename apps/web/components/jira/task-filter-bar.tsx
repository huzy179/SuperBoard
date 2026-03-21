import type { ProjectMemberDTO } from '@superboard/shared';
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
  hasActiveFilters: boolean;
  onFilterQueryChange: (value: string) => void;
  onFilterAssigneeChange: (value: string) => void;
  onToggleStatus: (value: string) => void;
  onTogglePriority: (value: string) => void;
  onToggleType: (value: string) => void;
  onSortByChange: (value: TaskSortBy) => void;
  onToggleSortDir: () => void;
  onClearFilters: () => void;
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
  hasActiveFilters,
  onFilterQueryChange,
  onFilterAssigneeChange,
  onToggleStatus,
  onTogglePriority,
  onToggleType,
  onSortByChange,
  onToggleSortDir,
  onClearFilters,
}: TaskFilterBarProps) {
  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
          Bộ lọc nhanh
        </p>
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
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
          className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700 sm:w-56"
          aria-label="Tìm kiếm task"
        />

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
          <span className="text-[11px] text-slate-500">Trạng thái</span>
          {BOARD_COLUMNS.map((column) => (
            <button
              key={column.key}
              type="button"
              onClick={() => onToggleStatus(column.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filterStatuses.has(column.key)
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {column.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <select
          value={filterAssignee}
          onChange={(event) => onFilterAssigneeChange(event.target.value)}
          className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-xs text-slate-700"
          aria-label="Lọc theo người thực hiện"
        >
          <option value="">Người thực hiện</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.fullName}
            </option>
          ))}
        </select>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
          <span className="text-[11px] text-slate-500">Ưu tiên</span>
          {PRIORITY_OPTIONS.map((priority) => (
            <button
              key={priority.key}
              type="button"
              onClick={() => onTogglePriority(priority.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filterPriorities.has(priority.key)
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {priority.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
          <span className="text-[11px] text-slate-500">Loại</span>
          {TASK_TYPE_OPTIONS.map((taskType) => (
            <button
              key={taskType.key}
              type="button"
              onClick={() => onToggleType(taskType.key)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                filterTypes.has(taskType.key)
                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {taskType.label}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-slate-200" />

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-50 px-2 py-1">
          <span className="text-[11px] text-slate-500">Sắp xếp</span>
          <select
            value={sortBy}
            onChange={(event) => onSortByChange(event.target.value as TaskSortBy)}
            className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-700"
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
              className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-200"
              aria-label={sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortDir === 'asc' ? '↑ Tăng' : '↓ Giảm'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

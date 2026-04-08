import type {
  ProjectMemberDTO,
  ProjectTaskItemDTO,
  TaskPriorityDTO,
  TaskTypeDTO,
  WorkflowStatusTemplateDTO,
} from '@superboard/shared';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';

type TaskBulkActionBarProps = {
  members: ProjectMemberDTO[];
  selectedCount: number;
  selectedVisibleCount: number;
  totalVisibleCount: number;
  bulkStatus: ProjectTaskItemDTO['status'];
  bulkPriority: TaskPriorityDTO;
  bulkType: TaskTypeDTO;
  bulkDueDate: string;
  bulkAssigneeId: string;
  isStatusPending: boolean;
  isPriorityPending: boolean;
  isTypePending: boolean;
  isDueDatePending: boolean;
  isAssignPending: boolean;
  isDeletePending: boolean;
  onBulkStatusChange: (value: ProjectTaskItemDTO['status']) => void;
  onBulkPriorityChange: (value: TaskPriorityDTO) => void;
  onBulkTypeChange: (value: TaskTypeDTO) => void;
  onBulkDueDateChange: (value: string) => void;
  onBulkAssigneeIdChange: (value: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onApplyStatus: () => void;
  onApplyPriority: () => void;
  onApplyType: () => void;
  onApplyDueDate: () => void;
  onApplyAssignee: () => void;
  onDeleteSelected: () => void;
  workflow?: WorkflowStatusTemplateDTO | undefined;
};

export function TaskBulkActionBar({
  members,
  selectedCount,
  selectedVisibleCount,
  totalVisibleCount,
  bulkStatus,
  bulkPriority,
  bulkType,
  bulkDueDate,
  bulkAssigneeId,
  isStatusPending,
  isPriorityPending,
  isTypePending,
  isDueDatePending,
  isAssignPending,
  isDeletePending,
  onBulkStatusChange,
  onBulkPriorityChange,
  onBulkTypeChange,
  onBulkDueDateChange,
  onBulkAssigneeIdChange,
  onToggleSelectAllVisible,
  onClearSelection,
  onApplyStatus,
  onApplyPriority,
  onApplyType,
  onApplyDueDate,
  onApplyAssignee,
  onDeleteSelected,
  workflow,
}: TaskBulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-brand-700">Đã chọn {selectedCount} task</span>
        <button
          type="button"
          onClick={onClearSelection}
          className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
        >
          Xoá chọn
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleSelectAllVisible}
          className="rounded-md bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
        >
          {selectedVisibleCount === totalVisibleCount
            ? 'Bỏ chọn tất cả đang hiển thị'
            : 'Chọn tất cả đang hiển thị'}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <label className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Đổi trạng thái
          <select
            value={bulkStatus}
            onChange={(event) =>
              onBulkStatusChange(event.target.value as ProjectTaskItemDTO['status'])
            }
            className="ml-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700"
          >
            {workflow?.statuses
              ? workflow.statuses.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name}
                  </option>
                ))
              : BOARD_COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onApplyStatus}
          disabled={
            isStatusPending ||
            isPriorityPending ||
            isTypePending ||
            isDueDatePending ||
            isAssignPending ||
            isDeletePending
          }
          className="rounded-md bg-brand-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {isStatusPending ? 'Đang cập nhật...' : 'Áp dụng'}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <label className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Đổi ưu tiên
          <select
            value={bulkPriority}
            onChange={(event) => onBulkPriorityChange(event.target.value as TaskPriorityDTO)}
            className="ml-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700"
          >
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority.key} value={priority.key}>
                {priority.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onApplyPriority}
          disabled={
            isPriorityPending ||
            isStatusPending ||
            isTypePending ||
            isDueDatePending ||
            isAssignPending ||
            isDeletePending
          }
          className="rounded-md bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isPriorityPending ? 'Đang cập nhật...' : 'Áp dụng ưu tiên'}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <label className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Đổi loại task
          <select
            value={bulkType}
            onChange={(event) => onBulkTypeChange(event.target.value as TaskTypeDTO)}
            className="ml-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700"
          >
            {TASK_TYPE_OPTIONS.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onApplyType}
          disabled={
            isTypePending ||
            isStatusPending ||
            isPriorityPending ||
            isDueDatePending ||
            isAssignPending ||
            isDeletePending
          }
          className="rounded-md bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isTypePending ? 'Đang cập nhật...' : 'Áp dụng loại'}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <label className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Đổi hạn hoàn thành
          <input
            type="date"
            value={bulkDueDate}
            onChange={(event) => onBulkDueDateChange(event.target.value)}
            className="ml-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700"
          />
        </label>

        <button
          type="button"
          onClick={onApplyDueDate}
          disabled={
            isDueDatePending ||
            isStatusPending ||
            isPriorityPending ||
            isTypePending ||
            isAssignPending ||
            isDeletePending
          }
          className="rounded-md bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isDueDatePending ? 'Đang cập nhật...' : 'Áp dụng hạn'}
        </button>

        <div className="h-5 w-px bg-slate-200" />

        <label className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
          Gán người thực hiện
          <select
            value={bulkAssigneeId}
            onChange={(event) => onBulkAssigneeIdChange(event.target.value)}
            className="ml-2 rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700"
          >
            <option value="">-- Bỏ gán --</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.fullName}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={onApplyAssignee}
          disabled={
            isAssignPending ||
            isStatusPending ||
            isPriorityPending ||
            isTypePending ||
            isDueDatePending ||
            isDeletePending
          }
          className="rounded-md bg-slate-700 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {isAssignPending ? 'Đang gán...' : 'Áp dụng gán'}
        </button>

        <button
          type="button"
          onClick={onDeleteSelected}
          disabled={
            isDeletePending ||
            isStatusPending ||
            isPriorityPending ||
            isTypePending ||
            isDueDatePending ||
            isAssignPending
          }
          className="rounded-md bg-rose-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
        >
          {isDeletePending ? 'Đang xử lý...' : 'Xoá đã chọn'}
        </button>
      </div>
    </div>
  );
}

import type { ProjectMemberDTO, ProjectTaskItemDTO } from '@superboard/shared';
import { BOARD_COLUMNS } from '@/lib/constants/task';

type TaskBulkActionBarProps = {
  members: ProjectMemberDTO[];
  selectedCount: number;
  selectedVisibleCount: number;
  totalVisibleCount: number;
  bulkStatus: ProjectTaskItemDTO['status'];
  bulkAssigneeId: string;
  isStatusPending: boolean;
  isAssignPending: boolean;
  isDeletePending: boolean;
  onBulkStatusChange: (value: ProjectTaskItemDTO['status']) => void;
  onBulkAssigneeIdChange: (value: string) => void;
  onToggleSelectAllVisible: () => void;
  onClearSelection: () => void;
  onApplyStatus: () => void;
  onApplyAssignee: () => void;
  onDeleteSelected: () => void;
};

export function TaskBulkActionBar({
  members,
  selectedCount,
  selectedVisibleCount,
  totalVisibleCount,
  bulkStatus,
  bulkAssigneeId,
  isStatusPending,
  isAssignPending,
  isDeletePending,
  onBulkStatusChange,
  onBulkAssigneeIdChange,
  onToggleSelectAllVisible,
  onClearSelection,
  onApplyStatus,
  onApplyAssignee,
  onDeleteSelected,
}: TaskBulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2">
      <span className="text-xs font-semibold text-brand-700">Đã chọn {selectedCount} task</span>

      <button
        type="button"
        onClick={onToggleSelectAllVisible}
        className="rounded px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-white"
      >
        {selectedVisibleCount === totalVisibleCount
          ? 'Bỏ chọn tất cả đang hiển thị'
          : 'Chọn tất cả đang hiển thị'}
      </button>

      <div className="h-4 w-px bg-brand-200" />

      <label className="text-[11px] text-slate-600">
        Đổi trạng thái:
        <select
          value={bulkStatus}
          onChange={(event) =>
            onBulkStatusChange(event.target.value as ProjectTaskItemDTO['status'])
          }
          className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700"
        >
          {BOARD_COLUMNS.map((column) => (
            <option key={column.key} value={column.key}>
              {column.label}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onApplyStatus}
        disabled={isStatusPending || isAssignPending || isDeletePending}
        className="rounded bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {isStatusPending ? 'Đang cập nhật...' : 'Áp dụng'}
      </button>

      <div className="h-4 w-px bg-brand-200" />

      <label className="text-[11px] text-slate-600">
        Gán người thực hiện:
        <select
          value={bulkAssigneeId}
          onChange={(event) => onBulkAssigneeIdChange(event.target.value)}
          className="ml-2 rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700"
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
        disabled={isAssignPending || isStatusPending || isDeletePending}
        className="rounded bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {isAssignPending ? 'Đang gán...' : 'Áp dụng gán'}
      </button>

      <button
        type="button"
        onClick={onDeleteSelected}
        disabled={isDeletePending || isStatusPending || isAssignPending}
        className="rounded bg-rose-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
      >
        {isDeletePending ? 'Đang xử lý...' : 'Xoá đã chọn'}
      </button>

      <button
        type="button"
        onClick={onClearSelection}
        className="ml-auto rounded px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-white"
      >
        Xoá chọn
      </button>
    </div>
  );
}

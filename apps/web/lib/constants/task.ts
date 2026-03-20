import type { ProjectTaskItemDTO, TaskTypeDTO } from '@superboard/shared';

export type TaskPriority = ProjectTaskItemDTO['priority'];

export type BoardColumn = {
  key: ProjectTaskItemDTO['status'];
  label: string;
};

export const BOARD_COLUMNS: BoardColumn[] = [
  { key: 'todo', label: 'Cần làm' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'in_review', label: 'Đang review' },
  { key: 'done', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

export const PRIORITY_OPTIONS: Array<{ key: TaskPriority; label: string }> = [
  { key: 'low', label: 'Thấp' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'high', label: 'Cao' },
  { key: 'urgent', label: 'Khẩn cấp' },
];

export const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Khẩn',
  high: 'Cao',
  medium: 'TB',
  low: 'Thấp',
};

export const PRIORITY_SORT_ORDER: Record<string, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const COLUMN_BORDER: Record<string, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-500',
  in_review: 'border-t-amber-500',
  done: 'border-t-emerald-500',
  cancelled: 'border-t-slate-300',
};
export const TASK_TYPE_ICONS: Record<TaskTypeDTO, { icon: string; color: string }> = {
  task: { icon: '✓', color: 'text-blue-600 bg-blue-50' },
  bug: { icon: '🐛', color: 'text-red-600 bg-red-50' },
  story: { icon: '📖', color: 'text-green-600 bg-green-50' },
  epic: { icon: '⚡', color: 'text-purple-600 bg-purple-50' },
};

export const TASK_TYPE_OPTIONS: Array<{ key: TaskTypeDTO; label: string }> = [
  { key: 'task', label: 'Task' },
  { key: 'bug', label: 'Bug' },
  { key: 'story', label: 'Story' },
  { key: 'epic', label: 'Epic' },
];

export const STATUS_LABELS: Record<string, string> = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  in_review: 'Đang review',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
  cancelled: 'bg-slate-300',
};

export const EVENT_LABELS: Record<string, string> = {
  created: 'Tạo mới',
  updated: 'Cập nhật',
  status_changed: 'Đổi trạng thái',
  assignee_changed: 'Đổi người thực hiện',
  comment_added: 'Bình luận',
};

export const ROLE_OPTIONS = [
  { key: 'owner', label: 'Owner' },
  { key: 'admin', label: 'Admin' },
  { key: 'member', label: 'Member' },
];

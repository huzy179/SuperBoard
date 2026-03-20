'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { CommentItemDTO, ProjectTaskItemDTO } from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useProjectDetail } from '@/hooks/use-project-detail';
import {
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/use-task-mutations';
import {
  useTaskComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
} from '@/hooks/use-task-comments';
import { formatDate } from '@/lib/format-date';

type ViewMode = 'board' | 'list';

type BoardColumn = {
  key: ProjectTaskItemDTO['status'];
  label: string;
};

type TaskPriority = ProjectTaskItemDTO['priority'];

const PRIORITY_OPTIONS: Array<{ key: TaskPriority; label: string }> = [
  { key: 'low', label: 'Thấp' },
  { key: 'medium', label: 'Trung bình' },
  { key: 'high', label: 'Cao' },
  { key: 'urgent', label: 'Khẩn cấp' },
];

const BOARD_COLUMNS: BoardColumn[] = [
  { key: 'todo', label: 'Cần làm' },
  { key: 'in_progress', label: 'Đang làm' },
  { key: 'in_review', label: 'Đang review' },
  { key: 'done', label: 'Hoàn thành' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-slate-100 text-slate-600',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: 'Khẩn',
  high: 'Cao',
  medium: 'TB',
  low: 'Thấp',
};

const COLUMN_BORDER: Record<string, string> = {
  todo: 'border-t-slate-400',
  in_progress: 'border-t-blue-500',
  in_review: 'border-t-amber-500',
  done: 'border-t-emerald-500',
  cancelled: 'border-t-slate-300',
};

function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${PRIORITY_STYLES[priority]}`}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

function AssigneeAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span
      className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700"
      title={name}
    >
      {initials}
    </span>
  );
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const {
    data: project,
    isLoading: loading,
    isError,
    error: queryError,
  } = useProjectDetail(projectId);
  const error = isError ? (queryError?.message ?? 'Không tải được dự án') : null;

  const createTaskMutation = useCreateTask(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);

  const { user: currentUser } = useAuthSession();

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showCreateTaskPanel, setShowCreateTaskPanel] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<ProjectTaskItemDTO | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const boardData = useMemo(() => {
    const byStatus = new Map<ProjectTaskItemDTO['status'], ProjectTaskItemDTO[]>();

    BOARD_COLUMNS.forEach((column) => {
      byStatus.set(column.key, []);
    });

    (project?.tasks ?? []).forEach((task) => {
      const current = byStatus.get(task.status) ?? [];
      byStatus.set(task.status, [...current, task]);
    });

    return byStatus;
  }, [project?.tasks]);

  function toDateInputValue(dateString?: string | null): string {
    if (!dateString) {
      return '';
    }

    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return date.toISOString().slice(0, 10);
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = taskTitle.trim();
    if (!normalizedTitle) {
      setCreateTaskError('Tên task là bắt buộc');
      return;
    }

    setCreateTaskError(null);

    try {
      const description = taskDescription.trim();
      const assigneeId = taskAssigneeId.trim();

      await createTaskMutation.mutateAsync({
        title: normalizedTitle,
        status: taskStatus,
        priority: taskPriority,
        ...(taskDueDate ? { dueDate: taskDueDate } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(description ? { description } : {}),
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskStatus('todo');
      setTaskPriority('medium');
      setTaskDueDate('');
      setTaskAssigneeId('');
      setShowCreateTaskPanel(false);
    } catch (caughtError) {
      setCreateTaskError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo task');
    }
  }

  function handleUpdateTaskStatus(taskId: string, status: ProjectTaskItemDTO['status']) {
    if (!project) return;
    setTaskUpdateError(null);

    updateTaskStatusMutation.mutate(
      { taskId, status },
      {
        onError: (caughtError) => {
          setTaskUpdateError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Không thể cập nhật trạng thái task',
          );
        },
      },
    );
  }
  function handleOpenEdit(task: ProjectTaskItemDTO) {
    triggerRef.current = document.activeElement as HTMLElement;
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(toDateInputValue(task.dueDate));
    setEditAssigneeId(task.assigneeId ?? '');
    setTaskUpdateError(null);
  }

  function handleCloseEdit() {
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
    setEditStatus('todo');
    setEditPriority('medium');
    setEditDueDate('');
    setEditAssigneeId('');
    triggerRef.current?.focus();
    triggerRef.current = null;
  }

  // Focus the dialog when it opens
  useEffect(() => {
    if (editingTask && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [editingTask]);

  // Focus trap: cycle Tab/Shift+Tab within the dialog
  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      handleCloseEdit();
      return;
    }
    if (e.key !== 'Tab') return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask || !projectId) return;

    const normalizedTitle = editTitle.trim();
    if (!normalizedTitle) {
      setTaskUpdateError('Tên task không được để trống');
      return;
    }

    setTaskUpdateError(null);

    try {
      const assigneeId = editAssigneeId.trim();
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        data: {
          title: normalizedTitle,
          description: editDescription.trim(),
          status: editStatus,
          priority: editPriority,
          dueDate: editDueDate || null,
          assigneeId: assigneeId || null,
        },
      });
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật task',
      );
    }
  }

  async function handleDeleteTask() {
    if (!editingTask || !projectId || !confirm('Bạn có chắc chắn muốn xóa task này?')) return;

    setTaskUpdateError(null);

    try {
      await deleteTaskMutation.mutateAsync(editingTask.id);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(caughtError instanceof Error ? caughtError.message : 'Không thể xóa task');
    }
  }
  function handleDragStart(event: React.DragEvent<HTMLElement>, taskId: string) {
    event.dataTransfer.setData('text/task-id', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, status: ProjectTaskItemDTO['status']) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId || updateTaskStatusMutation.isPending) return;

    if (!project) return;

    const current = project.tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;

    handleUpdateTaskStatus(taskId, status);
  }

  if (loading) {
    return <FullPageLoader label="Đang tải project..." />;
  }

  if (error || !project) {
    return (
      <FullPageError
        title="Không thể tải project"
        message={error ?? 'Dữ liệu không tồn tại'}
        actionLabel="Quay lại Jira"
        onAction={() => {
          window.location.href = '/jira';
        }}
      />
    );
  }

  return (
    <section>
      <div className="mb-6">
        <Link href="/jira" className="text-sm font-medium text-brand-700 hover:text-brand-800">
          ← Quay lại
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{project.icon || '📊'}</span>
              <h1 className="text-2xl font-bold text-slate-900">{project.name}</h1>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {project.description || 'Chưa có mô tả cho project này.'}
            </p>
            <p className="mt-3 text-xs text-slate-500">Updated: {formatDate(project.updatedAt)}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-surface-border bg-white p-1">
            <button
              type="button"
              onClick={() => setShowCreateTaskPanel((value) => !value)}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50"
            >
              + Tạo task
            </button>
            <button
              type="button"
              onClick={() => setViewMode('board')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'board'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Board
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-brand-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {showCreateTaskPanel ? (
        <form
          onSubmit={handleCreateTask}
          className="mb-6 rounded-xl border border-surface-border bg-surface-card p-5 shadow-sm"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Task title
              <input
                type="text"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                placeholder="Ví dụ: Thiết kế flow login mới"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Status
              <select
                value={taskStatus}
                onChange={(event) =>
                  setTaskStatus(event.target.value as ProjectTaskItemDTO['status'])
                }
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {BOARD_COLUMNS.map((column) => (
                  <option key={column.key} value={column.key}>
                    {column.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Priority
              <select
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value as TaskPriority)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority.key} value={priority.key}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Due date
              <input
                type="date"
                value={taskDueDate}
                onChange={(event) => setTaskDueDate(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Assignee ID
              <input
                type="text"
                value={taskAssigneeId}
                onChange={(event) => setTaskAssigneeId(event.target.value)}
                placeholder="User ID"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>

            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Description
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                rows={3}
                placeholder="Chi tiết ngắn cho task"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
          </div>

          {createTaskError ? <p className="mt-3 text-sm text-rose-600">{createTaskError}</p> : null}

          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateTaskPanel(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={createTaskMutation.isPending}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createTaskMutation.isPending ? 'Đang tạo...' : 'Tạo task'}
            </button>
          </div>
        </form>
      ) : null}

      {project.tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-card p-10 text-center">
          <p className="text-base font-semibold text-slate-900">Project chưa có task</p>
          <p className="mt-2 text-sm text-slate-600">
            Tiếp theo mình có thể làm luôn luồng tạo task từ đây để bạn thao tác như Jira.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        <div className="grid gap-4 xl:grid-cols-5">
          {BOARD_COLUMNS.map((column) => {
            const tasks = boardData.get(column.key) ?? [];

            return (
              <div
                key={column.key}
                className={`rounded-xl border border-surface-border border-t-2 bg-surface-card ${COLUMN_BORDER[column.key] ?? ''}`}
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  handleDrop(event, column.key);
                }}
              >
                <div className="flex items-center justify-between border-b border-surface-border px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{column.label}</p>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {tasks.length}
                  </span>
                </div>

                <div className="space-y-3 p-3">
                  {tasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-500">
                      Không có task
                    </p>
                  ) : (
                    tasks.map((task) => (
                      <article
                        key={task.id}
                        tabIndex={0}
                        role="button"
                        aria-label={task.title}
                        draggable={!updateTaskStatusMutation.isPending}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onClick={() => handleOpenEdit(task)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenEdit(task);
                          }
                        }}
                        className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-xs ${
                          updateTaskStatusMutation.isPending &&
                          updateTaskStatusMutation.variables?.taskId === task.id
                            ? 'opacity-60'
                            : 'cursor-grab active:cursor-grabbing hover:border-brand-300'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-700">
                          {task.title}
                        </p>
                        {task.description ? (
                          <p className="mt-1 line-clamp-2 text-xs text-slate-600">
                            {task.description}
                          </p>
                        ) : null}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <PriorityBadge priority={task.priority} />
                            {task.dueDate ? (
                              <span className="text-[11px] text-slate-500">
                                {formatDate(task.dueDate)}
                              </span>
                            ) : null}
                          </div>
                          {task.assigneeName ? <AssigneeAvatar name={task.assigneeName} /> : null}
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card">
          <table className="min-w-full divide-y divide-surface-border text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Task</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {project.tasks.map((task) => (
                <tr
                  key={task.id}
                  tabIndex={0}
                  role="button"
                  aria-label={task.title}
                  onClick={() => handleOpenEdit(task)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleOpenEdit(task);
                    }
                  }}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {task.description}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.dueDate ? (
                        <span className="text-[11px] text-slate-500">
                          {formatDate(task.dueDate)}
                        </span>
                      ) : null}
                      {task.assigneeName ? <AssigneeAvatar name={task.assigneeName} /> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      disabled={updateTaskStatusMutation.isPending}
                      onChange={(event) => {
                        handleUpdateTaskStatus(
                          task.id,
                          event.target.value as ProjectTaskItemDTO['status'],
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700"
                    >
                      {BOARD_COLUMNS.map((column) => (
                        <option key={column.key} value={column.key}>
                          {column.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Edit Task Modal/Panel */}
      {editingTask ? (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/20 backdrop-blur-sm">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-detail-title"
            tabIndex={-1}
            onKeyDown={handleDialogKeyDown}
            className="h-full w-full max-w-lg animate-in slide-in-from-right border-l border-surface-border bg-surface-card shadow-2xl outline-none"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
                <h2 id="task-detail-title" className="text-xl font-bold text-slate-900">
                  Chi tiết task
                </h2>
                <button
                  type="button"
                  aria-label="Close task detail"
                  onClick={handleCloseEdit}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form
                id="task-edit-form"
                onSubmit={handleUpdateTask}
                className="flex-1 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="space-y-6">
                    <label className="block text-sm font-medium text-slate-700">
                      Tiêu đề
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        required
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Trạng thái
                      <select
                        value={editStatus}
                        onChange={(e) =>
                          setEditStatus(e.target.value as ProjectTaskItemDTO['status'])
                        }
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        {BOARD_COLUMNS.map((col) => (
                          <option key={col.key} value={col.key}>
                            {col.label}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Độ ưu tiên
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        {PRIORITY_OPTIONS.map((priority) => (
                          <option key={priority.key} value={priority.key}>
                            {priority.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm font-medium text-slate-700">
                      Hạn hoàn thành
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Người thực hiện (ID)
                      <input
                        type="text"
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder="User ID"
                      />
                    </label>

                    <label className="block text-sm font-medium text-slate-700">
                      Mô tả
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={6}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder="Thêm mô tả chi tiết..."
                      />
                    </label>

                    <div className="text-[11px] text-slate-500">
                      <p>Created: {formatDate(editingTask.createdAt)}</p>
                      <p>Last updated: {formatDate(editingTask.updatedAt)}</p>
                    </div>
                  </div>

                  {taskUpdateError ? (
                    <p role="alert" className="mt-4 text-sm text-rose-600">
                      {taskUpdateError}
                    </p>
                  ) : null}
                </div>

                {/* Comments Section */}
                <TaskCommentSection
                  projectId={projectId}
                  taskId={editingTask.id}
                  currentUserId={currentUser?.id ?? ''}
                />
              </form>

              <div className="flex items-center justify-between border-t border-surface-border px-6 py-4 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    void handleDeleteTask();
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  {deleteTaskMutation.isPending ? 'Đang xoá...' : 'Xoá task'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    form="task-edit-form"
                    disabled={updateTaskMutation.isPending}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                  >
                    {updateTaskMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;

  return new Date(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function TaskCommentSection({
  projectId,
  taskId,
  currentUserId,
}: {
  projectId: string;
  taskId: string;
  currentUserId: string;
}) {
  const { data: comments, isLoading } = useTaskComments(projectId, taskId);
  const createComment = useCreateComment(projectId, taskId);
  const updateComment = useUpdateComment(projectId, taskId);
  const deleteComment = useDeleteComment(projectId, taskId);

  const [newComment, setNewComment] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  async function handleCreateComment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = newComment.trim();
    if (!trimmed) return;

    setCreateError(null);
    try {
      await createComment.mutateAsync(trimmed);
      setNewComment('');
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create comment');
    }
  }

  function startEditComment(comment: CommentItemDTO) {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
    setEditError(null);
  }

  function cancelEditComment() {
    setEditingCommentId(null);
    setEditContent('');
    setEditError(null);
  }

  async function handleSaveEditComment(commentId: string) {
    const trimmed = editContent.trim();
    if (!trimmed) return;

    setEditError(null);
    try {
      await updateComment.mutateAsync({ commentId, content: trimmed });
      setEditingCommentId(null);
      setEditContent('');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Failed to update comment');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    setDeleteError(null);
    try {
      await deleteComment.mutateAsync(commentId);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete comment');
    }
  }
  return (
    <div className="border-t border-surface-border px-6 py-4">
      <h3 className="mb-3 text-sm font-semibold text-slate-900">Bình luận</h3>

      {deleteError ? (
        <p role="alert" className="mb-2 text-xs text-rose-600">
          {deleteError}
        </p>
      ) : null}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-slate-200" />
              <div className="h-3 w-full rounded bg-slate-200" />
            </div>
          ))}
        </div>
      ) : !comments || comments.length === 0 ? (
        <p className="mb-4 text-xs text-slate-500">Chưa có bình luận</p>
      ) : (
        <div className="mb-4 space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-slate-200 bg-white p-3">
              {editingCommentId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    aria-label="Edit comment"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  />
                  {editError ? (
                    <p role="alert" className="text-xs text-rose-600">
                      {editError}
                    </p>
                  ) : null}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEditComment(comment.id)}
                      disabled={updateComment.isPending || !editContent.trim()}
                      className="rounded-md bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                    >
                      {updateComment.isPending ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditComment}
                      className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">
                        {comment.authorId === currentUserId ? 'You' : comment.authorName}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    {comment.authorId === currentUserId ? (
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEditComment(comment)}
                          aria-label={`Edit comment by ${comment.authorName}`}
                          className="rounded px-2 py-0.5 text-[11px] font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteComment.isPending}
                          aria-label={`Delete comment by ${comment.authorName}`}
                          className="rounded px-2 py-0.5 text-[11px] font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleCreateComment} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={2}
          placeholder="Thêm bình luận..."
          aria-label="Bình luận mới"
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
        />
        {createError ? (
          <p role="alert" className="text-xs text-rose-600">
            {createError}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={!newComment.trim() || createComment.isPending}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {createComment.isPending ? 'Đang gửi...' : 'Gửi'}
        </button>
      </form>
    </div>
  );
}

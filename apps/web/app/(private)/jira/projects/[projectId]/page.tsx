'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ProjectTaskItemDTO, TaskTypeDTO, ProjectMemberDTO } from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import {
  TaskTypeIcon,
  PriorityBadge,
  StoryPointsBadge,
  AssigneeAvatar,
  LabelDots,
  TaskIdBadge,
} from '@/components/ui/task-badges';
import { TaskCommentSection } from '@/components/task-comment-section';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useProjectDetail } from '@/hooks/use-project-detail';
import {
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/use-task-mutations';
import { formatDate } from '@/lib/format-date';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  PRIORITY_SORT_ORDER,
  COLUMN_BORDER,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';
import { toDateInputValue } from '@/lib/helpers';

type ViewMode = 'board' | 'list';

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

  const members: ProjectMemberDTO[] = project?.members ?? [];
  const projectKey: string | null = project?.key ?? null;

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showCreateTaskPanel, setShowCreateTaskPanel] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskTypeDTO>('task');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);

  // Filter & Sort state
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const hasActiveFilters =
    filterAssignee !== '' || filterPriorities.size > 0 || filterTypes.size > 0 || sortBy !== '';

  function clearFilters() {
    setFilterAssignee('');
    setFilterPriorities(new Set());
    setFilterTypes(new Set());
    setSortBy('');
    setSortDir('asc');
  }

  function toggleFilterPriority(p: string) {
    setFilterPriorities((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p);
      else next.add(p);
      return next;
    });
  }

  function toggleFilterType(t: string) {
    setFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const filteredTasks = useMemo(() => {
    let tasks = project?.tasks ?? [];
    if (filterAssignee) {
      tasks = tasks.filter((t) => t.assigneeId === filterAssignee);
    }
    if (filterPriorities.size > 0) {
      tasks = tasks.filter((t) => filterPriorities.has(t.priority));
    }
    if (filterTypes.size > 0) {
      tasks = tasks.filter((t) => filterTypes.has(t.type ?? 'task'));
    }
    if (sortBy) {
      tasks = [...tasks].sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'dueDate') {
          const da = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
          const db = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
          cmp = da - db;
        } else if (sortBy === 'createdAt') {
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else if (sortBy === 'priority') {
          cmp = (PRIORITY_SORT_ORDER[a.priority] ?? 2) - (PRIORITY_SORT_ORDER[b.priority] ?? 2);
        } else if (sortBy === 'storyPoints') {
          cmp = (a.storyPoints ?? 0) - (b.storyPoints ?? 0);
        }
        return sortDir === 'desc' ? -cmp : cmp;
      });
    }
    return tasks;
  }, [project?.tasks, filterAssignee, filterPriorities, filterTypes, sortBy, sortDir]);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<ProjectTaskItemDTO | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editType, setEditType] = useState<TaskTypeDTO>('task');
  const [editStoryPoints, setEditStoryPoints] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const boardData = useMemo(() => {
    const byStatus = new Map<ProjectTaskItemDTO['status'], ProjectTaskItemDTO[]>();
    BOARD_COLUMNS.forEach((column) => {
      byStatus.set(column.key, []);
    });
    filteredTasks.forEach((task) => {
      const current = byStatus.get(task.status) ?? [];
      byStatus.set(task.status, [...current, task]);
    });
    return byStatus;
  }, [filteredTasks]);

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
        type: taskType,
        ...(taskDueDate ? { dueDate: taskDueDate } : {}),
        ...(assigneeId ? { assigneeId } : {}),
        ...(description ? { description } : {}),
      });
      setTaskTitle('');
      setTaskDescription('');
      setTaskStatus('todo');
      setTaskPriority('medium');
      setTaskType('task');
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
    setEditType(task.type ?? 'task');
    setEditStoryPoints(task.storyPoints != null ? String(task.storyPoints) : '');
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
    setEditType('task');
    setEditStoryPoints('');
    setEditDueDate('');
    setEditAssigneeId('');
    triggerRef.current?.focus();
    triggerRef.current = null;
  }

  useEffect(() => {
    if (editingTask && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [editingTask]);

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
      const sp = editStoryPoints.trim();
      await updateTaskMutation.mutateAsync({
        taskId: editingTask.id,
        data: {
          title: normalizedTitle,
          description: editDescription.trim(),
          status: editStatus,
          priority: editPriority,
          type: editType,
          storyPoints: sp ? parseInt(sp, 10) : null,
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
    if (!editingTask || !projectId || !confirm('Bạn có chắc chắn muốn xoá task này?')) return;
    setTaskUpdateError(null);
    try {
      await deleteTaskMutation.mutateAsync(editingTask.id);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(caughtError instanceof Error ? caughtError.message : 'Không thể xoá task');
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
    setDragOverColumn(null);
    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId || updateTaskStatusMutation.isPending) return;
    if (!project) return;
    const current = project.tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;
    handleUpdateTaskStatus(taskId, status);
  }

  function isOverdue(dueDate?: string | null): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  }

  if (loading) {
    return <FullPageLoader label="Đang tải project..." />;
  }

  if (error || !project) {
    return (
      <FullPageError
        title="Không thể tải project"
        message={error ?? 'Dữ liệu không tồn tại'}
        actionLabel="Quay lại danh sách"
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
              {projectKey ? (
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-medium text-slate-500">
                  {projectKey}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {project.description || 'Chưa có mô tả cho project này.'}
            </p>
            <p className="mt-3 text-xs text-slate-500">Cập nhật: {formatDate(project.updatedAt)}</p>
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
              Danh sách
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
              Tiêu đề task
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
              Trạng thái
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
              Độ ưu tiên
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
              Loại task
              <select
                value={taskType}
                onChange={(event) => setTaskType(event.target.value as TaskTypeDTO)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {TASK_TYPE_OPTIONS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Hạn hoàn thành
              <input
                type="date"
                value={taskDueDate}
                onChange={(event) => setTaskDueDate(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Người thực hiện
              <select
                value={taskAssigneeId}
                onChange={(event) => setTaskAssigneeId(event.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="">-- Chưa gán --</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Mô tả
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

      {/* Filter & Sort Bar */}
      <div className="animate-fade-in mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-surface-border bg-surface-card px-3 py-2">
        <select
          value={filterAssignee}
          onChange={(e) => setFilterAssignee(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
          aria-label="Lọc theo người thực hiện"
        >
          <option value="">Người thực hiện</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName}
            </option>
          ))}
        </select>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Ưu tiên:</span>
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => toggleFilterPriority(p.key)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                filterPriorities.has(p.key)
                  ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Loại:</span>
          {TASK_TYPE_OPTIONS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => toggleFilterType(t.key)}
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors ${
                filterTypes.has(t.key)
                  ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <span className="text-[11px] text-slate-500">Sắp xếp:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-[11px] text-slate-700"
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
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200"
              aria-label={sortDir === 'asc' ? 'Tăng dần' : 'Giảm dần'}
            >
              {sortDir === 'asc' ? '↑ Tăng' : '↓ Giảm'}
            </button>
          ) : null}
        </div>

        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="ml-auto rounded px-2 py-1 text-[11px] font-medium text-rose-600 hover:bg-rose-50"
          >
            Xoá bộ lọc
          </button>
        ) : null}
      </div>

      {project.tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-surface-border bg-surface-card p-10 text-center">
          <p className="text-base font-semibold text-slate-900">Project chưa có task</p>
          <p className="mt-2 text-sm text-slate-600">
            Bấm "Tạo task" để thêm task mới cho project này.
          </p>
        </div>
      ) : viewMode === 'board' ? (
        /* Board View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {BOARD_COLUMNS.map((column) => {
            const tasks = boardData.get(column.key) ?? [];
            const isDragOver = dragOverColumn === column.key;
            return (
              <div
                key={column.key}
                className={`w-72 shrink-0 rounded-xl border border-t-2 bg-surface-card ${COLUMN_BORDER[column.key] ?? ''} ${
                  isDragOver
                    ? 'border-dashed border-brand-400 bg-brand-50/30 animate-pulse'
                    : 'border-surface-border'
                }`}
                onDragOver={(e) => {
                  handleDragOver(e);
                  setDragOverColumn(column.key);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(event) => handleDrop(event, column.key)}
              >
                <div className="flex items-center justify-between border-b border-surface-border bg-gradient-to-r from-slate-50 to-white px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{column.label}</p>
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-200 px-1.5 text-[11px] font-bold text-slate-700">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-2 p-2">
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
                        className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-xs border-l-2 ${
                          task.priority === 'urgent'
                            ? 'border-l-red-500'
                            : task.priority === 'high'
                              ? 'border-l-orange-500'
                              : task.priority === 'medium'
                                ? 'border-l-blue-400'
                                : 'border-l-slate-300'
                        } ${
                          updateTaskStatusMutation.isPending &&
                          updateTaskStatusMutation.variables?.taskId === task.id
                            ? 'opacity-60'
                            : 'cursor-pointer hover:border-brand-300 hover:shadow-md hover:scale-[1.01] transition-transform'
                        }`}
                      >
                        {/* Top: type icon + task ID + story points */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <TaskTypeIcon type={task.type ?? 'task'} />
                            <TaskIdBadge projectKey={projectKey} number={task.number} />
                          </div>
                          {task.storyPoints ? <StoryPointsBadge points={task.storyPoints} /> : null}
                        </div>
                        {/* Title */}
                        <p className="text-sm font-medium text-slate-900 group-hover:text-brand-700">
                          {task.title}
                        </p>
                        {/* Labels */}
                        {task.labels && task.labels.length > 0 ? (
                          <div className="mt-1.5">
                            <LabelDots labels={task.labels} />
                          </div>
                        ) : null}
                        {/* Bottom: priority + due date + assignee */}
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <PriorityBadge priority={task.priority} />
                            {task.dueDate ? (
                              <span
                                className={`text-[11px] ${isOverdue(task.dueDate) && task.status !== 'done' ? 'font-semibold text-red-600' : 'text-slate-500'}`}
                              >
                                {formatDate(task.dueDate)}
                              </span>
                            ) : null}
                          </div>
                          {task.assigneeName ? (
                            <AssigneeAvatar
                              name={task.assigneeName}
                              color={task.assigneeAvatarColor}
                            />
                          ) : null}
                        </div>
                      </article>
                    ))
                  )}
                </div>
                {/* Quick add button */}
                <button
                  type="button"
                  onClick={() => {
                    setTaskStatus(column.key);
                    setShowCreateTaskPanel(true);
                  }}
                  className="w-full border-t border-surface-border px-3 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                >
                  + Thêm task
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-card">
          <table className="min-w-full divide-y divide-surface-border text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Task</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Độ ưu tiên</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">
                  Người thực hiện
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Cập nhật</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border bg-white">
              {filteredTasks.map((task) => (
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
                  className="cursor-pointer transition-colors hover:bg-brand-50/50 even:bg-slate-50/50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <TaskTypeIcon type={task.type ?? 'task'} />
                      <TaskIdBadge projectKey={projectKey} number={task.number} />
                    </div>
                    <p className="mt-0.5 font-medium text-slate-900">{task.title}</p>
                    {task.labels && task.labels.length > 0 ? (
                      <div className="mt-1">
                        <LabelDots labels={task.labels} />
                      </div>
                    ) : null}
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
                  <td className="px-4 py-3">
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td className="px-4 py-3">
                    {task.assigneeName ? (
                      <div className="flex items-center gap-1.5">
                        <AssigneeAvatar name={task.assigneeName} color={task.assigneeAvatarColor} />
                        <span className="text-xs text-slate-600">{task.assigneeName}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Chưa gán</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(task.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Task Slide-over */}
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
                <div className="flex items-center gap-3">
                  <TaskTypeIcon type={editingTask.type ?? 'task'} />
                  {projectKey && editingTask.number ? (
                    <span className="font-mono text-sm font-semibold text-slate-500">
                      {projectKey}-{editingTask.number}
                    </span>
                  ) : null}
                  <h2 id="task-detail-title" className="text-lg font-bold text-slate-900">
                    Chi tiết task
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Đóng chi tiết task"
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
                  <div className="space-y-5">
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

                    {/* Task type selector */}
                    <div>
                      <p className="text-sm font-medium text-slate-700 mb-2">Loại task</p>
                      <div className="flex gap-1">
                        {TASK_TYPE_OPTIONS.map((t) => {
                          const config = TASK_TYPE_ICONS[t.key];
                          return (
                            <button
                              key={t.key}
                              type="button"
                              onClick={() => setEditType(t.key)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                editType === t.key
                                  ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-300'
                                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <span className="text-sm">{config.icon}</span>
                              {t.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <label className="block text-sm font-medium text-slate-700">
                        Story Points
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editStoryPoints}
                          onChange={(e) => setEditStoryPoints(e.target.value)}
                          placeholder="—"
                          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        />
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
                    </div>

                    <label className="block text-sm font-medium text-slate-700">
                      Người thực hiện
                      <select
                        value={editAssigneeId}
                        onChange={(e) => setEditAssigneeId(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      >
                        <option value="">-- Chưa gán --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.fullName}
                          </option>
                        ))}
                      </select>
                    </label>

                    {/* Labels display */}
                    {editingTask.labels && editingTask.labels.length > 0 ? (
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-2">Nhãn</p>
                        <LabelDots labels={editingTask.labels} />
                      </div>
                    ) : null}

                    <label className="block text-sm font-medium text-slate-700">
                      Mô tả
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={5}
                        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        placeholder="Thêm mô tả chi tiết..."
                      />
                    </label>

                    <div className="text-[11px] text-slate-500">
                      <p>Tạo lúc: {formatDate(editingTask.createdAt)}</p>
                      <p>Cập nhật: {formatDate(editingTask.updatedAt)}</p>
                    </div>
                  </div>

                  {taskUpdateError ? (
                    <p role="alert" className="mt-4 text-sm text-rose-600">
                      {taskUpdateError}
                    </p>
                  ) : null}
                </div>

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

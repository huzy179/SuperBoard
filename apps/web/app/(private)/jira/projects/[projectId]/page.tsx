'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ProjectDetailDTO, ProjectTaskItemDTO } from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import {
  createProjectTask,
  deleteProjectTask,
  getProjectDetail,
  updateProjectTask,
  updateProjectTaskStatus,
} from '@/lib/services/project-service';

type ViewMode = 'board' | 'list';

type BoardColumn = {
  key: ProjectTaskItemDTO['status'];
  label: string;
};

type TaskPriority = ProjectTaskItemDTO['priority'];

const PRIORITY_OPTIONS: Array<{ key: TaskPriority; label: string }> = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'urgent', label: 'Urgent' },
];

const BOARD_COLUMNS: BoardColumn[] = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'in_review', label: 'In Review' },
  { key: 'done', label: 'Done' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectDetailDTO | null>(null);
  const [reloadSeed, setReloadSeed] = useState(0);
  const [showCreateTaskPanel, setShowCreateTaskPanel] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [createTaskLoading, setCreateTaskLoading] = useState(false);
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);
  const [taskUpdatingId, setTaskUpdatingId] = useState<string | null>(null);
  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);

  // Edit Task State
  const [editingTask, setEditingTask] = useState<ProjectTaskItemDTO | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setError('Thiếu projectId');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getProjectDetail(projectId)
      .then((payload) => {
        setProject(payload);
      })
      .catch((caughtError) => {
        setError(caughtError instanceof Error ? caughtError.message : 'Không tải được dự án');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, reloadSeed]);

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

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

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
    setCreateTaskLoading(true);

    try {
      const description = taskDescription.trim();
      const assigneeId = taskAssigneeId.trim();

      await createProjectTask(projectId, {
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
      setReloadSeed((value) => value + 1);
    } catch (caughtError) {
      setCreateTaskError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo task');
    } finally {
      setCreateTaskLoading(false);
    }
  }

  async function handleUpdateTaskStatus(taskId: string, status: ProjectTaskItemDTO['status']) {
    if (!project) return;

    const previous = project;
    const nextTasks = previous.tasks.map((task) =>
      task.id === taskId ? { ...task, status } : task,
    );
    setProject({ ...previous, tasks: nextTasks });
    setTaskUpdateError(null);
    setTaskUpdatingId(taskId);

    try {
      await updateProjectTaskStatus(project.id, taskId, { status });
      setReloadSeed((value) => value + 1);
    } catch (caughtError) {
      setProject(previous);
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật trạng thái task',
      );
    } finally {
      setTaskUpdatingId(null);
    }
  }

  function handleOpenEdit(task: ProjectTaskItemDTO) {
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
    setEditPriority('medium');
    setEditDueDate('');
    setEditAssigneeId('');
    setIsEditLoading(false);
  }

  async function handleUpdateTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingTask || !projectId) return;

    const normalizedTitle = editTitle.trim();
    if (!normalizedTitle) {
      setTaskUpdateError('Tên task không được để trống');
      return;
    }

    setIsEditLoading(true);
    setTaskUpdateError(null);

    try {
      const assigneeId = editAssigneeId.trim();
      await updateProjectTask(projectId, editingTask.id, {
        title: normalizedTitle,
        description: editDescription.trim(),
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        assigneeId: assigneeId || null,
      });
      setReloadSeed((v) => v + 1);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật task',
      );
    } finally {
      setIsEditLoading(false);
    }
  }

  async function handleDeleteTask() {
    if (!editingTask || !projectId || !confirm('Bạn có chắc chắn muốn xóa task này?')) return;

    setIsDeleteLoading(true);
    setTaskUpdateError(null);

    try {
      await deleteProjectTask(projectId, editingTask.id);
      setReloadSeed((v) => v + 1);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(caughtError instanceof Error ? caughtError.message : 'Không thể xóa task');
    } finally {
      setIsDeleteLoading(false);
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

  async function handleDrop(
    event: React.DragEvent<HTMLElement>,
    status: ProjectTaskItemDTO['status'],
  ) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId || taskUpdatingId) return;

    if (!project) return;

    const current = project.tasks.find((task) => task.id === taskId);
    if (!current || current.status === status) return;

    await handleUpdateTaskStatus(taskId, status);
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
          ← Quay lại danh sách dự án
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
              + Create task
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
              disabled={createTaskLoading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {createTaskLoading ? 'Đang tạo...' : 'Tạo task'}
            </button>
          </div>
        </form>
      ) : null}

      {taskUpdateError ? (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          {taskUpdateError}
        </div>
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
                className="rounded-xl border border-surface-border bg-surface-card"
                onDragOver={handleDragOver}
                onDrop={(event) => {
                  void handleDrop(event, column.key);
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
                        draggable={taskUpdatingId !== task.id}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onClick={() => handleOpenEdit(task)}
                        className={`group relative rounded-lg border border-slate-200 bg-white p-3 shadow-xs ${
                          taskUpdatingId === task.id
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
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase">
                            {task.priority}
                          </span>
                          {task.dueDate ? <span>Due: {formatDate(task.dueDate)}</span> : null}
                        </div>
                        <p className="mt-2 text-[11px] text-slate-500">
                          Updated: {formatDate(task.updatedAt)}
                        </p>
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
                  onClick={() => handleOpenEdit(task)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{task.title}</p>
                    {task.description ? (
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {task.description}
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-medium uppercase">
                        {task.priority}
                      </span>
                      {task.dueDate ? <span>Due: {formatDate(task.dueDate)}</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={task.status}
                      disabled={taskUpdatingId === task.id}
                      onChange={(event) => {
                        void handleUpdateTaskStatus(
                          task.id,
                          event.target.value as ProjectTaskItemDTO['status'],
                        );
                      }}
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
          <div className="h-full w-full max-w-lg animate-in slide-in-from-right border-l border-surface-border bg-surface-card shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-surface-border px-6 py-4">
                <h2 className="text-xl font-bold text-slate-900">Task Detail</h2>
                <button
                  onClick={handleCloseEdit}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateTask} className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <label className="block text-sm font-medium text-slate-700">
                    Title
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      required
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Status
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
                    Priority
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
                    Due date
                    <input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Assignee ID
                    <input
                      type="text"
                      value={editAssigneeId}
                      onChange={(e) => setEditAssigneeId(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="User ID"
                    />
                  </label>

                  <label className="block text-sm font-medium text-slate-700">
                    Description
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={6}
                      className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                      placeholder="Add a more detailed description..."
                    />
                  </label>

                  <div className="text-[11px] text-slate-500">
                    <p>Created: {formatDate(editingTask.createdAt)}</p>
                    <p>Last updated: {formatDate(editingTask.updatedAt)}</p>
                  </div>
                </div>

                {taskUpdateError ? (
                  <p className="mt-4 text-sm text-rose-600">{taskUpdateError}</p>
                ) : null}
              </form>

              <div className="flex items-center justify-between border-t border-surface-border px-6 py-4 bg-slate-50">
                <button
                  type="button"
                  onClick={handleDeleteTask}
                  disabled={isDeleteLoading}
                  className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                >
                  {isDeleteLoading ? 'Deletetion...' : 'Delete Task'}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCloseEdit}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      const form = (e.target as HTMLElement)
                        .closest('div')
                        ?.parentElement?.querySelector('form');
                      if (form) form.requestSubmit();
                    }}
                    disabled={isEditLoading}
                    className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isEditLoading ? 'Saving...' : 'Save Changes'}
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

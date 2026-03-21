'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
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
import { TaskCreateForm } from '@/components/jira/task-create-form';
import { TaskFilterBar } from '@/components/jira/task-filter-bar';
import { TaskBulkActionBar } from '@/components/jira/task-bulk-action-bar';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useProjectDetail } from '@/hooks/use-project-detail';
import {
  useBulkTaskOperation,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/use-task-mutations';
import { formatDate } from '@/lib/format-date';
import {
  BOARD_COLUMNS,
  PRIORITY_OPTIONS,
  COLUMN_BORDER,
  TASK_TYPE_OPTIONS,
  TASK_TYPE_ICONS,
  type TaskPriority,
} from '@/lib/constants/task';
import { toDateInputValue } from '@/lib/helpers';
import {
  buildFractionalTaskPosition,
  buildBoardData,
  filterAndSortProjectTasks,
  isTaskOverdue,
  toggleSetFilterValue,
  type SortDirection,
  type TaskSortBy,
} from '@/lib/helpers/task-view';
import { useJiraProjectUiStore } from '@/stores/jira-project-ui-store';

type ViewMode = 'board' | 'list';

function parseCsvSet(value: string | null, allowed: ReadonlySet<string>): Set<string> {
  if (!value) {
    return new Set();
  }
  const next = new Set<string>();
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      if (allowed.has(item)) {
        next.add(item);
      }
    });
  return next;
}

function serializeCsvSet(value: Set<string>): string {
  return [...value].sort().join(',');
}

function parseViewMode(value: string | null): ViewMode {
  return value === 'list' ? 'list' : 'board';
}

function parseTaskSortBy(value: string | null): TaskSortBy {
  if (
    value === 'dueDate' ||
    value === 'createdAt' ||
    value === 'priority' ||
    value === 'storyPoints'
  ) {
    return value;
  }
  return '';
}

function parseSortDirection(value: string | null): SortDirection {
  return value === 'desc' ? 'desc' : 'asc';
}

function areSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) {
    return false;
  }
  for (const value of a) {
    if (!b.has(value)) {
      return false;
    }
  }
  return true;
}

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const {
    data: project,
    isLoading: loading,
    isError,
    error: queryError,
  } = useProjectDetail(projectId);
  const error = isError ? (queryError?.message ?? 'Không tải được dự án') : null;

  const createTaskMutation = useCreateTask(projectId);
  const bulkTaskMutation = useBulkTaskOperation(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);

  const { user: currentUser } = useAuthSession();

  const members: ProjectMemberDTO[] = project?.members ?? [];
  const projectKey: string | null = project?.key ?? null;

  const allowedStatuses = useMemo(() => new Set(BOARD_COLUMNS.map((column) => column.key)), []);
  const allowedPriorities = useMemo(
    () => new Set(PRIORITY_OPTIONS.map((priority) => priority.key)),
    [],
  );
  const allowedTypes = useMemo(() => new Set(TASK_TYPE_OPTIONS.map((type) => type.key)), []);

  const {
    viewMode,
    showCreateTaskPanel,
    filterAssignee,
    filterQuery,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    sortDir,
    setViewMode,
    setShowCreateTaskPanel,
    setFilterAssignee,
    setFilterQuery,
    setFilterStatuses,
    setFilterPriorities,
    setFilterTypes,
    setSortBy,
    setSortDir,
    resetUiState,
  } = useJiraProjectUiStore();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskType, setTaskType] = useState<TaskTypeDTO>('task');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [createTaskError, setCreateTaskError] = useState<string | null>(null);

  // Filter & Sort state
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [bulkPriority, setBulkPriority] = useState<TaskPriority>('medium');
  const [bulkType, setBulkType] = useState<TaskTypeDTO>('task');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkAssigneeId, setBulkAssigneeId] = useState('');
  const [bulkUpdatePending, setBulkUpdatePending] = useState(false);
  const [bulkPriorityPending, setBulkPriorityPending] = useState(false);
  const [bulkTypePending, setBulkTypePending] = useState(false);
  const [bulkDueDatePending, setBulkDueDatePending] = useState(false);
  const [bulkAssignPending, setBulkAssignPending] = useState(false);
  const [bulkDeletePending, setBulkDeletePending] = useState(false);
  const [pendingDeleteTaskIds, setPendingDeleteTaskIds] = useState<Set<string>>(new Set());
  const [pendingDeleteSecondsLeft, setPendingDeleteSecondsLeft] = useState(0);
  const [pendingDeleteProgress, setPendingDeleteProgress] = useState(0);

  const hasActiveFilters =
    filterQuery.trim() !== '' ||
    filterAssignee !== '' ||
    filterStatuses.size > 0 ||
    filterPriorities.size > 0 ||
    filterTypes.size > 0 ||
    sortBy !== '';

  function clearFilters() {
    setFilterQuery('');
    setFilterAssignee('');
    setFilterStatuses(new Set());
    setFilterPriorities(new Set());
    setFilterTypes(new Set());
    setSortBy('');
    setSortDir('asc');
  }

  function toggleFilterStatus(status: string) {
    setFilterStatuses((prev) => toggleSetFilterValue(prev, status));
  }

  function toggleFilterPriority(p: string) {
    setFilterPriorities((prev) => toggleSetFilterValue(prev, p));
  }

  function toggleFilterType(t: string) {
    setFilterTypes((prev) => toggleSetFilterValue(prev, t));
  }

  const filteredTasks = useMemo(() => {
    return filterAndSortProjectTasks(project?.tasks ?? [], {
      query: filterQuery,
      assigneeId: filterAssignee,
      statuses: filterStatuses,
      priorities: filterPriorities,
      types: filterTypes,
      sortBy,
      sortDir,
    });
  }, [
    project?.tasks,
    filterQuery,
    filterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    sortDir,
  ]);

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
  const bulkDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkDeleteCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isApplyingUrlStateRef = useRef(false);

  const visibleTasks = useMemo(
    () => filteredTasks.filter((task) => !pendingDeleteTaskIds.has(task.id)),
    [filteredTasks, pendingDeleteTaskIds],
  );

  const boardData = useMemo(() => {
    return buildBoardData(
      visibleTasks,
      BOARD_COLUMNS.map((column) => column.key),
    );
  }, [visibleTasks]);

  const selectedVisibleCount = useMemo(
    () => visibleTasks.filter((task) => selectedTaskIds.has(task.id)).length,
    [visibleTasks, selectedTaskIds],
  );

  const isDragDropLocked = pendingDeleteTaskIds.size > 0 || bulkDeletePending;
  const statusSelectLockReason = isDragDropLocked
    ? 'Đang chờ xác nhận xoá, tạm khoá chỉnh sửa'
    : updateTaskStatusMutation.isPending
      ? 'Đang cập nhật trạng thái task'
      : undefined;

  useEffect(() => {
    resetUiState();
  }, [projectId, resetUiState]);

  useEffect(() => {
    const nextViewMode = parseViewMode(searchParams.get('view'));
    const nextQuery = searchParams.get('q') ?? '';
    const nextAssignee = searchParams.get('assignee') ?? '';
    const nextStatuses = parseCsvSet(searchParams.get('statuses'), allowedStatuses);
    const nextPriorities = parseCsvSet(searchParams.get('priorities'), allowedPriorities);
    const nextTypes = parseCsvSet(searchParams.get('types'), allowedTypes);
    const nextSortBy = parseTaskSortBy(searchParams.get('sortBy'));
    const nextSortDir = parseSortDirection(searchParams.get('sortDir'));

    let changed = false;
    if (viewMode !== nextViewMode) {
      changed = true;
      setViewMode(nextViewMode);
    }
    if (filterQuery !== nextQuery) {
      changed = true;
      setFilterQuery(nextQuery);
    }
    if (filterAssignee !== nextAssignee) {
      changed = true;
      setFilterAssignee(nextAssignee);
    }
    if (!areSetsEqual(filterStatuses, nextStatuses)) {
      changed = true;
      setFilterStatuses(nextStatuses);
    }
    if (!areSetsEqual(filterPriorities, nextPriorities)) {
      changed = true;
      setFilterPriorities(nextPriorities);
    }
    if (!areSetsEqual(filterTypes, nextTypes)) {
      changed = true;
      setFilterTypes(nextTypes);
    }
    if (sortBy !== nextSortBy) {
      changed = true;
      setSortBy(nextSortBy);
    }
    if (sortDir !== nextSortDir) {
      changed = true;
      setSortDir(nextSortDir);
    }

    if (changed) {
      isApplyingUrlStateRef.current = true;
    }
  }, [searchParams, allowedStatuses, allowedPriorities, allowedTypes]);

  useEffect(() => {
    if (isApplyingUrlStateRef.current) {
      isApplyingUrlStateRef.current = false;
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());

    if (viewMode === 'board') {
      nextParams.delete('view');
    } else {
      nextParams.set('view', viewMode);
    }

    const normalizedQuery = filterQuery.trim();
    if (!normalizedQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', normalizedQuery);
    }

    if (!filterAssignee) {
      nextParams.delete('assignee');
    } else {
      nextParams.set('assignee', filterAssignee);
    }

    const statusesValue = serializeCsvSet(filterStatuses);
    if (!statusesValue) {
      nextParams.delete('statuses');
    } else {
      nextParams.set('statuses', statusesValue);
    }

    const prioritiesValue = serializeCsvSet(filterPriorities);
    if (!prioritiesValue) {
      nextParams.delete('priorities');
    } else {
      nextParams.set('priorities', prioritiesValue);
    }

    const typesValue = serializeCsvSet(filterTypes);
    if (!typesValue) {
      nextParams.delete('types');
    } else {
      nextParams.set('types', typesValue);
    }

    if (!sortBy) {
      nextParams.delete('sortBy');
      nextParams.delete('sortDir');
    } else {
      nextParams.set('sortBy', sortBy);
      nextParams.set('sortDir', sortDir);
    }

    const nextQuery = nextParams.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }
  }, [
    viewMode,
    filterQuery,
    filterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    sortDir,
    pathname,
    router,
    searchParams,
  ]);

  useEffect(() => {
    const currentTaskIds = new Set((project?.tasks ?? []).map((task) => task.id));
    setSelectedTaskIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (currentTaskIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [project?.tasks]);

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((prev) => toggleSetFilterValue(prev, taskId));
  }

  function clearTaskSelection() {
    setSelectedTaskIds(new Set());
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleTasks.map((task) => task.id);
    const allVisibleSelected = visibleIds.every((id) => selectedTaskIds.has(id));
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function clearBulkDeleteTimer() {
    if (bulkDeleteTimerRef.current) {
      clearTimeout(bulkDeleteTimerRef.current);
      bulkDeleteTimerRef.current = null;
    }
    if (bulkDeleteCountdownRef.current) {
      clearInterval(bulkDeleteCountdownRef.current);
      bulkDeleteCountdownRef.current = null;
    }
  }

  async function commitPendingBulkDelete(taskIds: string[]) {
    if (taskIds.length === 0) {
      return;
    }
    setTaskUpdateError(null);
    setBulkDeletePending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds,
        delete: true,
      });
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể xoá task hàng loạt',
      );
    } finally {
      setBulkDeletePending(false);
      setPendingDeleteTaskIds(new Set());
      setPendingDeleteSecondsLeft(0);
      setPendingDeleteProgress(0);
      clearBulkDeleteTimer();
    }
  }

  function handleUndoBulkDelete() {
    clearBulkDeleteTimer();
    setPendingDeleteTaskIds(new Set());
    setPendingDeleteSecondsLeft(0);
    setPendingDeleteProgress(0);
  }

  async function handleBulkUpdateStatus() {
    const targetTaskIds = visibleTasks
      .filter((task) => selectedTaskIds.has(task.id) && task.status !== bulkStatus)
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkUpdatePending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds: targetTaskIds,
        status: bulkStatus,
      });
      clearTaskSelection();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể cập nhật trạng thái hàng loạt',
      );
    } finally {
      setBulkUpdatePending(false);
    }
  }

  async function handleBulkAssignAssignee() {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = visibleTasks
      .filter((task) => selectedTaskIds.has(task.id) && (task.assigneeId ?? '') !== bulkAssigneeId)
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkAssignPending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds: targetTaskIds,
        assigneeId: bulkAssigneeId || null,
      });
      clearTaskSelection();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật người thực hiện',
      );
    } finally {
      setBulkAssignPending(false);
    }
  }

  async function handleBulkUpdatePriority() {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = visibleTasks
      .filter((task) => selectedTaskIds.has(task.id) && task.priority !== bulkPriority)
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkPriorityPending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds: targetTaskIds,
        priority: bulkPriority,
      });
      clearTaskSelection();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể cập nhật độ ưu tiên hàng loạt',
      );
    } finally {
      setBulkPriorityPending(false);
    }
  }

  async function handleBulkUpdateType() {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = visibleTasks
      .filter((task) => selectedTaskIds.has(task.id) && (task.type ?? 'task') !== bulkType)
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkTypePending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds: targetTaskIds,
        type: bulkType,
      });
      clearTaskSelection();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể cập nhật loại task hàng loạt',
      );
    } finally {
      setBulkTypePending(false);
    }
  }

  async function handleBulkUpdateDueDate() {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = visibleTasks
      .filter((task) => {
        if (!selectedTaskIds.has(task.id)) {
          return false;
        }
        const currentDueDate = toDateInputValue(task.dueDate);
        return currentDueDate !== bulkDueDate;
      })
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkDueDatePending(true);
    try {
      await bulkTaskMutation.mutateAsync({
        taskIds: targetTaskIds,
        dueDate: bulkDueDate || null,
      });
      clearTaskSelection();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Không thể cập nhật hạn hoàn thành hàng loạt',
      );
    } finally {
      setBulkDueDatePending(false);
    }
  }

  async function handleBulkDeleteTasks() {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = [...selectedTaskIds];
    if (targetTaskIds.length === 0) {
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xoá ${targetTaskIds.length} task đã chọn?`)) {
      return;
    }

    setTaskUpdateError(null);
    if (editingTask && selectedTaskIds.has(editingTask.id)) {
      handleCloseEdit();
    }
    clearTaskSelection();
    setPendingDeleteTaskIds(new Set(targetTaskIds));
    setPendingDeleteSecondsLeft(5);
    setPendingDeleteProgress(100);
    clearBulkDeleteTimer();
    requestAnimationFrame(() => {
      setPendingDeleteProgress(0);
    });
    bulkDeleteCountdownRef.current = setInterval(() => {
      setPendingDeleteSecondsLeft((prev) => {
        if (prev <= 1) {
          if (bulkDeleteCountdownRef.current) {
            clearInterval(bulkDeleteCountdownRef.current);
            bulkDeleteCountdownRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    bulkDeleteTimerRef.current = setTimeout(() => {
      void commitPendingBulkDelete(targetTaskIds);
    }, 5000);
  }

  useEffect(() => {
    return () => {
      clearBulkDeleteTimer();
    };
  }, []);

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

  function handleUpdateTaskStatus(
    taskId: string,
    status: ProjectTaskItemDTO['status'],
    position?: string,
  ) {
    if (!project) return;
    setTaskUpdateError(null);
    updateTaskStatusMutation.mutate(
      {
        taskId,
        status,
        ...(position !== undefined ? { position } : {}),
      },
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
    if (isDragDropLocked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/task-id', taskId);
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    if (isDragDropLocked) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, status: ProjectTaskItemDTO['status']) {
    handleDropByPosition(event, status);
  }

  function buildDropPosition(
    status: ProjectTaskItemDTO['status'],
    draggedTaskId: string,
    targetTaskId?: string,
  ): string {
    const tasksInTargetColumn = (boardData.get(status) ?? []).filter(
      (task) => task.id !== draggedTaskId,
    );

    if (!targetTaskId) {
      const previousTask = tasksInTargetColumn[tasksInTargetColumn.length - 1];
      return buildFractionalTaskPosition({
        previousPosition: previousTask?.position,
      });
    }

    const targetIndex = tasksInTargetColumn.findIndex((task) => task.id === targetTaskId);
    if (targetIndex === -1) {
      const previousTask = tasksInTargetColumn[tasksInTargetColumn.length - 1];
      return buildFractionalTaskPosition({
        previousPosition: previousTask?.position,
      });
    }

    const previousTask = targetIndex > 0 ? tasksInTargetColumn[targetIndex - 1] : undefined;
    const nextTask = tasksInTargetColumn[targetIndex];
    return buildFractionalTaskPosition({
      previousPosition: previousTask?.position,
      nextPosition: nextTask?.position,
    });
  }

  function handleDropByPosition(
    event: React.DragEvent<HTMLElement>,
    status: ProjectTaskItemDTO['status'],
    targetTaskId?: string,
  ) {
    if (isDragDropLocked) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    setDragOverColumn(null);

    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId || updateTaskStatusMutation.isPending) return;
    if (targetTaskId && taskId === targetTaskId) return;

    if (!project) return;
    const current = project.tasks.find((task) => task.id === taskId);
    if (!current) return;

    const nextPosition = buildDropPosition(status, taskId, targetTaskId);
    const samePosition = current.position === nextPosition;
    if (current.status === status && samePosition) {
      return;
    }

    handleUpdateTaskStatus(taskId, status, nextPosition);
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
        <TaskCreateForm
          members={members}
          taskTitle={taskTitle}
          taskDescription={taskDescription}
          taskStatus={taskStatus}
          taskPriority={taskPriority}
          taskType={taskType}
          taskDueDate={taskDueDate}
          taskAssigneeId={taskAssigneeId}
          createTaskError={createTaskError}
          createTaskPending={createTaskMutation.isPending}
          onTaskTitleChange={setTaskTitle}
          onTaskDescriptionChange={setTaskDescription}
          onTaskStatusChange={setTaskStatus}
          onTaskPriorityChange={setTaskPriority}
          onTaskTypeChange={setTaskType}
          onTaskDueDateChange={setTaskDueDate}
          onTaskAssigneeIdChange={setTaskAssigneeId}
          onCancel={() => setShowCreateTaskPanel(false)}
          onSubmit={handleCreateTask}
        />
      ) : null}

      <TaskFilterBar
        members={members}
        filterQuery={filterQuery}
        filterAssignee={filterAssignee}
        filterStatuses={filterStatuses}
        filterPriorities={filterPriorities}
        filterTypes={filterTypes}
        sortBy={sortBy}
        sortDir={sortDir}
        hasActiveFilters={hasActiveFilters}
        onFilterQueryChange={setFilterQuery}
        onFilterAssigneeChange={setFilterAssignee}
        onToggleStatus={toggleFilterStatus}
        onTogglePriority={toggleFilterPriority}
        onToggleType={toggleFilterType}
        onSortByChange={setSortBy}
        onToggleSortDir={() => setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'))}
        onClearFilters={clearFilters}
      />

      <TaskBulkActionBar
        members={members}
        selectedCount={selectedTaskIds.size}
        selectedVisibleCount={selectedVisibleCount}
        totalVisibleCount={visibleTasks.length}
        bulkStatus={bulkStatus}
        bulkPriority={bulkPriority}
        bulkType={bulkType}
        bulkDueDate={bulkDueDate}
        bulkAssigneeId={bulkAssigneeId}
        isStatusPending={bulkUpdatePending}
        isPriorityPending={bulkPriorityPending}
        isTypePending={bulkTypePending}
        isDueDatePending={bulkDueDatePending}
        isAssignPending={bulkAssignPending}
        isDeletePending={bulkDeletePending || pendingDeleteTaskIds.size > 0}
        onBulkStatusChange={setBulkStatus}
        onBulkPriorityChange={setBulkPriority}
        onBulkTypeChange={setBulkType}
        onBulkDueDateChange={setBulkDueDate}
        onBulkAssigneeIdChange={setBulkAssigneeId}
        onToggleSelectAllVisible={toggleSelectAllVisible}
        onClearSelection={clearTaskSelection}
        onApplyStatus={() => {
          void handleBulkUpdateStatus();
        }}
        onApplyPriority={() => {
          void handleBulkUpdatePriority();
        }}
        onApplyType={() => {
          void handleBulkUpdateType();
        }}
        onApplyDueDate={() => {
          void handleBulkUpdateDueDate();
        }}
        onApplyAssignee={() => {
          void handleBulkAssignAssignee();
        }}
        onDeleteSelected={() => {
          void handleBulkDeleteTasks();
        }}
      />

      {pendingDeleteTaskIds.size > 0 ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-amber-800">
              Đã đưa {pendingDeleteTaskIds.size} task vào hàng chờ xoá. Tự động xoá sau{' '}
              {pendingDeleteSecondsLeft} giây.
            </span>
            <button
              type="button"
              onClick={handleUndoBulkDelete}
              className="ml-auto rounded bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
            >
              Hoàn tác
            </button>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-amber-100">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${pendingDeleteProgress}%`, transition: 'width 5s linear' }}
            />
          </div>
        </div>
      ) : null}

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
                  if (!isDragDropLocked) {
                    setDragOverColumn(column.key);
                  }
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(event) => handleDrop(event, column.key)}
              >
                <div className="flex items-center justify-between border-b border-surface-border bg-linear-to-r from-slate-50 to-white px-3 py-2">
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
                        draggable={!updateTaskStatusMutation.isPending && !isDragDropLocked}
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onDragOver={(event) => {
                          handleDragOver(event);
                          event.stopPropagation();
                        }}
                        onDrop={(event) => handleDropByPosition(event, column.key, task.id)}
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
                            : isDragDropLocked
                              ? 'cursor-not-allowed opacity-80'
                              : 'cursor-pointer hover:border-brand-300 hover:shadow-md hover:scale-[1.01] transition-transform'
                        } ${selectedTaskIds.has(task.id) ? 'ring-1 ring-brand-300' : ''}
                      `}
                      >
                        <div className="mb-1 flex justify-end">
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.has(task.id)}
                            onChange={() => toggleTaskSelection(task.id)}
                            onClick={(event) => event.stopPropagation()}
                            aria-label={`Chọn task ${task.title}`}
                            className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                          />
                        </div>
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
                                className={`text-[11px] ${isTaskOverdue(task.dueDate) && task.status !== 'done' ? 'font-semibold text-red-600' : 'text-slate-500'}`}
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
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      visibleTasks.length > 0 && selectedVisibleCount === visibleTasks.length
                    }
                    onChange={toggleSelectAllVisible}
                    aria-label="Chọn tất cả task đang hiển thị"
                    className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                  />
                </th>
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
              {visibleTasks.map((task) => (
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
                  className={`cursor-pointer transition-colors hover:bg-brand-50/50 even:bg-slate-50/50 ${
                    selectedTaskIds.has(task.id) ? 'bg-brand-50/40' : ''
                  }`}
                >
                  <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => toggleTaskSelection(task.id)}
                      aria-label={`Chọn task ${task.title}`}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-brand-600"
                    />
                  </td>
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
                      disabled={updateTaskStatusMutation.isPending || isDragDropLocked}
                      title={statusSelectLockReason}
                      onChange={(event) => {
                        handleUpdateTaskStatus(
                          task.id,
                          event.target.value as ProjectTaskItemDTO['status'],
                        );
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-100"
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

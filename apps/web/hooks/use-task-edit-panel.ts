import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { toast } from 'sonner';
import type {
  CreateTaskRequestDTO,
  ProjectTaskItemDTO,
  TaskTypeDTO,
  UpdateTaskRequestDTO,
} from '@superboard/shared';
import type { TaskPriority } from '@/lib/constants/task';
import { toDateInputValue } from '@/lib/helpers';

type UseTaskEditPanelParams = {
  projectId: string;
  projectTasks: ProjectTaskItemDTO[] | undefined;
  createTask: (payload: CreateTaskRequestDTO) => Promise<unknown>;
  updateTask: (input: { taskId: string; data: UpdateTaskRequestDTO }) => Promise<unknown>;
  updateTaskStatus: (input: {
    taskId: string;
    status: ProjectTaskItemDTO['status'];
    position?: string | null;
  }) => Promise<unknown>;
  deleteTask: (taskId: string) => Promise<unknown>;
  restoreTask: (taskId: string) => Promise<unknown>;
};

export function useTaskEditPanel({
  projectId,
  projectTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  restoreTask,
}: UseTaskEditPanelParams) {
  const [editingTask, setEditingTask] = useState<ProjectTaskItemDTO | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectTaskItemDTO['status']>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editType, setEditType] = useState<TaskTypeDTO>('task');
  const [editStoryPoints, setEditStoryPoints] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssigneeId, setEditAssigneeId] = useState('');

  const [taskUpdateError, setTaskUpdateError] = useState<string | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  const [subtaskError, setSubtaskError] = useState<string | null>(null);
  const [subtaskPendingTaskId, setSubtaskPendingTaskId] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const subtaskMap = useMemo(() => {
    const map = new Map<string, ProjectTaskItemDTO[]>();
    for (const task of projectTasks ?? []) {
      if (!task.parentTaskId) {
        continue;
      }
      const current = map.get(task.parentTaskId) ?? [];
      map.set(task.parentTaskId, [...current, task]);
    }
    return map;
  }, [projectTasks]);

  const editingTaskSubtasks = useMemo(() => {
    if (!editingTask) {
      return [];
    }
    const subtasks = subtaskMap.get(editingTask.id) ?? [];
    return [...subtasks].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [editingTask, subtaskMap]);

  const editingParentTask = useMemo(() => {
    if (!editingTask?.parentTaskId) {
      return null;
    }
    return (projectTasks ?? []).find((task) => task.id === editingTask.parentTaskId) ?? null;
  }, [editingTask, projectTasks]);

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
    setSubtaskTitle('');
    setSubtaskError(null);
    setSubtaskPendingTaskId(null);
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
    setSubtaskTitle('');
    setSubtaskError(null);
    setSubtaskPendingTaskId(null);
    triggerRef.current?.focus();
    triggerRef.current = null;
  }

  useEffect(() => {
    if (editingTask && dialogRef.current) {
      dialogRef.current.focus();
    }
  }, [editingTask]);

  const handleDialogKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      handleCloseEdit();
      return;
    }
    if (event.key !== 'Tab') return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
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
      const storyPoints = editStoryPoints.trim();
      await updateTask({
        taskId: editingTask.id,
        data: {
          title: normalizedTitle,
          description: editDescription.trim(),
          status: editStatus,
          priority: editPriority,
          type: editType,
          storyPoints: storyPoints ? parseInt(storyPoints, 10) : null,
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
    if (!editingTask || !projectId || !window.confirm('Bạn có chắc chắn muốn lưu trữ task này?')) {
      return;
    }
    setTaskUpdateError(null);
    try {
      await deleteTask(editingTask.id);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể lưu trữ task',
      );
    }
  }

  async function handleRestoreTask() {
    if (!editingTask || !projectId) return;
    setTaskUpdateError(null);
    try {
      await restoreTask(editingTask.id);
      handleCloseEdit();
    } catch (caughtError) {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể khôi phục task',
      );
    }
  }

  async function handleCreateSubtask() {
    if (!editingTask || editingTask.parentTaskId) {
      return;
    }

    const normalizedTitle = subtaskTitle.trim();
    if (!normalizedTitle) {
      setSubtaskError('Tên subtask là bắt buộc');
      return;
    }

    setSubtaskError(null);
    setSubtaskPendingTaskId(editingTask.id);

    try {
      await createTask({
        title: normalizedTitle,
        status: 'todo',
        priority: 'medium',
        type: 'task',
        parentTaskId: editingTask.id,
      });
      toast.success('Tạo subtask thành công!');
      setSubtaskTitle('');
    } catch (caughtError) {
      setSubtaskError(caughtError instanceof Error ? caughtError.message : 'Không thể tạo subtask');
      toast.error('Không thể tạo subtask');
    } finally {
      setSubtaskPendingTaskId(null);
    }
  }

  async function handleToggleSubtaskDone(subtask: ProjectTaskItemDTO) {
    setSubtaskError(null);
    setSubtaskPendingTaskId(subtask.id);
    try {
      await updateTaskStatus({
        taskId: subtask.id,
        status: subtask.status === 'done' ? 'todo' : 'done',
      });
    } catch (caughtError) {
      setSubtaskError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật subtask',
      );
      toast.error('Không thể cập nhật subtask');
    } finally {
      setSubtaskPendingTaskId(null);
    }
  }

  async function handleDeleteSubtask(subtaskId: string) {
    if (!window.confirm('Bạn có chắc chắn muốn xoá subtask này?')) {
      return;
    }

    setSubtaskError(null);
    setSubtaskPendingTaskId(subtaskId);
    try {
      await deleteTask(subtaskId);
      toast.success('Đã xoá subtask');
    } catch (caughtError) {
      setSubtaskError(caughtError instanceof Error ? caughtError.message : 'Không thể xoá subtask');
      toast.error('Không thể xoá subtask');
    } finally {
      setSubtaskPendingTaskId(null);
    }
  }

  return {
    editingTask,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editStatus,
    setEditStatus,
    editPriority,
    setEditPriority,
    editType,
    setEditType,
    editStoryPoints,
    setEditStoryPoints,
    editDueDate,
    setEditDueDate,
    editAssigneeId,
    setEditAssigneeId,
    taskUpdateError,
    setTaskUpdateError,
    subtaskTitle,
    setSubtaskTitle,
    subtaskError,
    subtaskPendingTaskId,
    editingTaskSubtasks,
    editingParentTask,
    dialogRef,
    handleDialogKeyDown,
    handleOpenEdit,
    handleCloseEdit,
    handleUpdateTask,
    handleDeleteTask,
    handleRestoreTask,
    handleCreateSubtask,
    handleToggleSubtaskDone,
    handleDeleteSubtask,
  };
}

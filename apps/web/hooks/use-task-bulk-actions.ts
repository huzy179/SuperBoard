import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import type { ProjectTaskItemDTO, TaskTypeDTO } from '@superboard/shared';
import type { TaskPriority } from '@/lib/constants/task';
import { toDateInputValue } from '@/lib/helpers';

type BulkTaskInput = {
  taskIds: string[];
  status?: ProjectTaskItemDTO['status'];
  priority?: TaskPriority;
  type?: TaskTypeDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
  delete?: boolean;
};

type UseTaskBulkActionsParams = {
  filteredTasks: ProjectTaskItemDTO[];
  runBulkTaskOperation: (input: BulkTaskInput) => Promise<unknown>;
  setTaskUpdateError: Dispatch<SetStateAction<string | null>>;
};

type TaskSelectionInput = {
  selectedTaskIds: Set<string>;
  clearTaskSelection: () => void;
};

type DeleteSelectionInput = {
  selectedTaskIds: Set<string>;
  clearTaskSelection: () => void;
};

export function useTaskBulkActions({
  filteredTasks,
  runBulkTaskOperation,
  setTaskUpdateError,
}: UseTaskBulkActionsParams) {
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

  const bulkDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bulkDeleteCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isDragDropLocked = pendingDeleteTaskIds.size > 0 || bulkDeletePending;

  const visibleTasks = useMemo(
    () => filteredTasks.filter((task) => !pendingDeleteTaskIds.has(task.id)),
    [filteredTasks, pendingDeleteTaskIds],
  );

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
      await runBulkTaskOperation({
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

  async function handleBulkUpdateStatus({
    selectedTaskIds,
    clearTaskSelection,
  }: TaskSelectionInput) {
    const targetTaskIds = visibleTasks
      .filter((task) => selectedTaskIds.has(task.id) && task.status !== bulkStatus)
      .map((task) => task.id);

    if (targetTaskIds.length === 0) {
      return;
    }

    setTaskUpdateError(null);
    setBulkUpdatePending(true);
    try {
      await runBulkTaskOperation({
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

  async function handleBulkAssignAssignee({
    selectedTaskIds,
    clearTaskSelection,
  }: TaskSelectionInput) {
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
      await runBulkTaskOperation({
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

  async function handleBulkUpdatePriority({
    selectedTaskIds,
    clearTaskSelection,
  }: TaskSelectionInput) {
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
      await runBulkTaskOperation({
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

  async function handleBulkUpdateType({ selectedTaskIds, clearTaskSelection }: TaskSelectionInput) {
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
      await runBulkTaskOperation({
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

  async function handleBulkUpdateDueDate({
    selectedTaskIds,
    clearTaskSelection,
  }: TaskSelectionInput) {
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
      await runBulkTaskOperation({
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

  async function handleBulkDeleteTasks({
    selectedTaskIds,
    clearTaskSelection,
  }: DeleteSelectionInput) {
    if (pendingDeleteTaskIds.size > 0 || bulkDeletePending) {
      return;
    }

    const targetTaskIds = [...selectedTaskIds];
    if (targetTaskIds.length === 0) {
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xoá ${targetTaskIds.length} task đã chọn?`)) {
      return;
    }

    setTaskUpdateError(null);
    clearTaskSelection();
    setPendingDeleteTaskIds(new Set(targetTaskIds));
    setPendingDeleteSecondsLeft(5);
    setPendingDeleteProgress(100);

    clearBulkDeleteTimer();
    requestAnimationFrame(() => {
      setPendingDeleteProgress(0);
    });

    bulkDeleteCountdownRef.current = setInterval(() => {
      setPendingDeleteSecondsLeft((previousSecondsLeft) => {
        if (previousSecondsLeft <= 1) {
          if (bulkDeleteCountdownRef.current) {
            clearInterval(bulkDeleteCountdownRef.current);
            bulkDeleteCountdownRef.current = null;
          }
          return 0;
        }
        return previousSecondsLeft - 1;
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

  return {
    bulkStatus,
    setBulkStatus,
    bulkPriority,
    setBulkPriority,
    bulkType,
    setBulkType,
    bulkDueDate,
    setBulkDueDate,
    bulkAssigneeId,
    setBulkAssigneeId,
    bulkUpdatePending,
    bulkPriorityPending,
    bulkTypePending,
    bulkDueDatePending,
    bulkAssignPending,
    bulkDeletePending,
    pendingDeleteTaskIds,
    pendingDeleteSecondsLeft,
    pendingDeleteProgress,
    visibleTasks,
    isDragDropLocked,
    handleUndoBulkDelete,
    handleBulkUpdateStatus,
    handleBulkAssignAssignee,
    handleBulkUpdatePriority,
    handleBulkUpdateType,
    handleBulkUpdateDueDate,
    handleBulkDeleteTasks,
  };
}

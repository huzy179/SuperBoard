import { useEffect, useMemo, useState } from 'react';
import type { ProjectTaskItemDTO } from '@superboard/shared';
import { toggleSetFilterValue } from '@/lib/helpers/task-view';

export function useTaskSelection(
  projectTasks: ProjectTaskItemDTO[] | undefined,
  visibleTasks: ProjectTaskItemDTO[],
) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const currentTaskIds = new Set((projectTasks ?? []).map((task) => task.id));
    setSelectedTaskIds((previous) => {
      const next = new Set<string>();
      previous.forEach((id) => {
        if (currentTaskIds.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [projectTasks]);

  function toggleTaskSelection(taskId: string) {
    setSelectedTaskIds((previous) => toggleSetFilterValue(new Set(previous), taskId));
  }

  const [lastSelectedTaskId, setLastSelectedTaskId] = useState<string | null>(null);

  function handleSelectTask(taskId: string, event: React.MouseEvent | React.KeyboardEvent) {
    const isModifierPressed = event.metaKey || event.ctrlKey;
    const isShiftPressed = event.shiftKey;

    setSelectedTaskIds((previous) => {
      const next = new Set(previous);

      if (isShiftPressed && lastSelectedTaskId) {
        // Range selection
        const allIds = visibleTasks.map((t) => t.id);
        const currentIndex = allIds.indexOf(taskId);
        const lastIndex = allIds.indexOf(lastSelectedTaskId);

        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const rangeIds = allIds.slice(start, end + 1);

          // In range selection, we usually add all items in range
          rangeIds.forEach((id) => next.add(id));
        }
      } else if (isModifierPressed) {
        // Additive selection
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      } else {
        // Single selection
        next.clear();
        next.add(taskId);
      }

      return next;
    });

    setLastSelectedTaskId(taskId);
  }

  function clearTaskSelection() {
    setSelectedTaskIds(new Set());
    setLastSelectedTaskId(null);
  }

  function toggleSelectAllVisible() {
    const visibleIds = visibleTasks.map((task) => task.id);
    const allVisibleSelected = visibleIds.every((id) => selectedTaskIds.has(id));

    setSelectedTaskIds((previous) => {
      const next = new Set(previous);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const selectedVisibleCount = useMemo(() => {
    return visibleTasks.filter((task) => selectedTaskIds.has(task.id)).length;
  }, [selectedTaskIds, visibleTasks]);

  return {
    selectedTaskIds,
    setSelectedTaskIds,
    toggleTaskSelection,
    handleSelectTask,
    clearTaskSelection,
    toggleSelectAllVisible,
    selectedVisibleCount,
  };
}

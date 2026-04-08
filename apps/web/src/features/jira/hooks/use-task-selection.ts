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
    setSelectedTaskIds((previous) => toggleSetFilterValue(previous, taskId));
  }

  function clearTaskSelection() {
    setSelectedTaskIds(new Set());
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
    clearTaskSelection,
    toggleSelectAllVisible,
    selectedVisibleCount,
  };
}

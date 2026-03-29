import { useCallback, useMemo, useState } from 'react';
import type { ProjectTaskItemDTO } from '@superboard/shared';
import { getCalendarCells, toLocalDayKey } from '@/lib/helpers/project-detail-calendar';

export function useProjectCalendar(tasks: ProjectTaskItemDTO[]) {
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  const dueTasksByDate = useMemo(() => {
    const map = new Map<string, ProjectTaskItemDTO[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const key = toLocalDayKey(new Date(task.dueDate));
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(task);
      }
    });
    return map;
  }, [tasks]);

  const tasksWithoutDueDate = useMemo(() => tasks.filter((t) => !t.dueDate), [tasks]);

  const calendarCells = useMemo(() => getCalendarCells(calendarMonth), [calendarMonth]);

  const calendarMonthLabel = calendarMonth.toLocaleString('vi-VN', {
    month: 'long',
    year: 'numeric',
  });

  const prevMonth = useCallback(
    () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)),
    [],
  );

  const nextMonth = useCallback(
    () => setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)),
    [],
  );

  return {
    calendarMonth,
    setCalendarMonth,
    dueTasksByDate,
    tasksWithoutDueDate,
    calendarCells,
    calendarMonthLabel,
    prevMonth,
    nextMonth,
  };
}

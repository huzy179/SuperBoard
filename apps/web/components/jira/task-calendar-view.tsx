'use client';

import type { ProjectTaskItemDTO } from '@superboard/shared';

interface CalendarCell {
  key: string;
  date: Date;
  inMonth: boolean;
}

interface TaskCalendarViewProps {
  calendarMonthLabel: string;
  calendarCells: CalendarCell[];
  dueTasksByDate: Map<string, ProjectTaskItemDTO[]>;
  tasksWithoutDueDate: ProjectTaskItemDTO[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
}

export function TaskCalendarView({
  calendarMonthLabel,
  calendarCells,
  dueTasksByDate,
  tasksWithoutDueDate,
  onPrevMonth,
  onNextMonth,
  onOpenEdit,
}: TaskCalendarViewProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
        <button
          type="button"
          onClick={onPrevMonth}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          ← Tháng trước
        </button>
        <p className="text-sm font-semibold text-slate-900 capitalize">{calendarMonthLabel}</p>
        <button
          type="button"
          onClick={onNextMonth}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Tháng sau →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-semibold tracking-wide text-slate-600 uppercase">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
          <div key={day} className="py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => {
          const dayTasks = dueTasksByDate.get(cell.key) ?? [];
          return (
            <div
              key={cell.key}
              className={`min-h-32 rounded-lg border p-2.5 ${
                cell.inMonth ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <p
                className={`mb-1 text-xs font-semibold ${cell.inMonth ? 'text-slate-700' : 'text-slate-400'}`}
              >
                {cell.date.getDate()}
              </p>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => onOpenEdit(task)}
                    className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-left text-xs text-slate-700 hover:border-brand-300 hover:bg-brand-50"
                    title={task.title}
                  >
                    <span className="line-clamp-1">{task.title}</span>
                  </button>
                ))}
                {dayTasks.length > 3 ? (
                  <p className="text-[11px] text-slate-500">+{dayTasks.length - 3} task</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {tasksWithoutDueDate.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <p className="mb-2 text-sm font-semibold text-slate-900">Task chưa có hạn hoàn thành</p>
          <div className="flex flex-wrap gap-2">
            {tasksWithoutDueDate.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenEdit(task)}
                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 hover:border-brand-300 hover:bg-brand-50"
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

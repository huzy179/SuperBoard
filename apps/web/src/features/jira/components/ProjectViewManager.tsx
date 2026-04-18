'use client';

import { TaskBoardView } from './task-board-view';
import { TaskListView } from './task-list-view';
import { TaskCalendarView } from './task-calendar-view';
import { ExecutiveBriefingCard } from '@/features/reports/components/executive-briefing-card';
import type { ProjectTaskItemDTO } from '@superboard/shared';
import { useProjectDetailContext } from '../context/ProjectDetailContext';

interface ProjectViewManagerProps {
  projectId: string;
  projectKey: string | null;
  visibleTasks: ProjectTaskItemDTO[];
  boardData: Map<string, ProjectTaskItemDTO[]>;
  dynamicColumns: { key: string; label: string }[];
  workflow?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  atRiskTaskIds: Set<string>;

  // Calendar specific
  calendarMonthLabel: string;
  calendarCells: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  dueTasksByDate: Map<string, ProjectTaskItemDTO[]>;
  tasksWithoutDueDate: ProjectTaskItemDTO[];
  onPrevMonth: () => void;
  onNextMonth: () => void;

  // Handlers
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  onAddTask: (status?: string) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  onDropTask: (taskId: string, newDate: string) => Promise<void>;

  // Selection
  selectedTaskIds: Set<string>;
  selectedVisibleCount: number;
  onSelectTask: (taskId: string, event?: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  toggleSelectAllVisible: () => void;

  // Board DnD
  isDragDropLocked: boolean;
  dragOverColumn: string | null;
  setDragOverColumn: (col: string | null) => void;
  draggedTaskId: string | null;
  handleDragStart: (event: any, taskId: string) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleDragOver: (event: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleDrop: (event: any, status: string) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleDropByPosition: (event: any, status: string, targetTaskId?: string) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  isUpdatePending: boolean;
  updatingTaskId?: string | undefined;
  statusSelectLockReason?: string | undefined;
}

export function ProjectViewManager({
  projectId,
  projectKey,
  visibleTasks,
  boardData,
  dynamicColumns,
  workflow,
  atRiskTaskIds,
  calendarMonthLabel,
  calendarCells,
  dueTasksByDate,
  tasksWithoutDueDate,
  onPrevMonth,
  onNextMonth,
  onOpenEdit,
  onUpdateTaskStatus,
  onDropTask,
  selectedTaskIds,
  selectedVisibleCount,
  onSelectTask,
  toggleSelectAllVisible,
  isDragDropLocked,
  dragOverColumn,
  setDragOverColumn,
  draggedTaskId,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDropByPosition,
  isUpdatePending,
  updatingTaskId,
  statusSelectLockReason,
}: ProjectViewManagerProps) {
  const { viewMode, setTaskStatus, setShowCreateTaskPanel } = useProjectDetailContext();

  const handleAddTask = (status?: string) => {
    setTaskStatus(status);
    setShowCreateTaskPanel(true);
  };
  if (viewMode === 'board') {
    return (
      <TaskBoardView
        boardData={boardData}
        projectKey={projectKey}
        isDragDropLocked={isDragDropLocked}
        dragOverColumn={dragOverColumn}
        setDragOverColumn={setDragOverColumn}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDropByPosition={handleDropByPosition}
        onOpenEdit={onOpenEdit}
        selectedTaskIds={selectedTaskIds}
        onSelectTask={onSelectTask}
        isUpdatePending={isUpdatePending}
        updatingTaskId={updatingTaskId}
        onAddTask={handleAddTask}
        columns={dynamicColumns}
        workflow={workflow}
        draggedTaskId={draggedTaskId}
        atRiskTaskIds={atRiskTaskIds}
      />
    );
  }

  if (viewMode === 'list') {
    return (
      <TaskListView
        visibleTasks={visibleTasks}
        projectKey={projectKey}
        selectedTaskIds={selectedTaskIds}
        selectedVisibleCount={selectedVisibleCount}
        onSelectTask={onSelectTask}
        toggleSelectAllVisible={toggleSelectAllVisible}
        onOpenEdit={onOpenEdit}
        onUpdateTaskStatus={onUpdateTaskStatus}
        isUpdatePending={isUpdatePending}
        isDragDropLocked={isDragDropLocked}
        statusSelectLockReason={statusSelectLockReason}
        workflow={workflow}
      />
    );
  }

  if (viewMode === 'insights') {
    return (
      <div className="animate-in fade-in zoom-in-95 duration-700">
        <ExecutiveBriefingCard projectId={projectId} />
      </div>
    );
  }

  return (
    <TaskCalendarView
      calendarMonthLabel={calendarMonthLabel}
      calendarCells={calendarCells}
      dueTasksByDate={dueTasksByDate}
      tasksWithoutDueDate={tasksWithoutDueDate}
      onPrevMonth={onPrevMonth}
      onNextMonth={onNextMonth}
      onOpenEdit={onOpenEdit}
      onDropTask={onDropTask}
      workflow={workflow}
    />
  );
}

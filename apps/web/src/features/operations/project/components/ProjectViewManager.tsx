'use client';

import React from 'react';
import { TaskBoardView } from '@/features/operations/task/components/task-board-view';
import { TaskListView } from '@/features/operations/task/components/task-list-view';
import { TaskCalendarView } from '@/features/operations/task/components/task-calendar-view';
import { NeuralBriefing } from '@/features/operations/dashboard/components/NeuralBriefing';
import type { ProjectTaskItemDTO, WorkflowStatusTemplateDTO } from '@superboard/shared';
import { useProjectDetailContext } from '../context/ProjectDetailContext';

interface ProjectViewManagerProps {
  projectId: string;
  projectKey: string | null;
  visibleTasks: ProjectTaskItemDTO[];
  boardData: Map<string, ProjectTaskItemDTO[]>;
  dynamicColumns: { key: string; label: string }[];
  workflow?: WorkflowStatusTemplateDTO | undefined;
  atRiskTaskIds: Set<string>;

  // Calendar specific
  calendarMonthLabel: string;
  calendarCells: {
    date: Date;
    inMonth: boolean;
    key: string;
  }[];
  dueTasksByDate: Map<string, ProjectTaskItemDTO[]>;
  tasksWithoutDueDate: ProjectTaskItemDTO[];
  onPrevMonth: () => void;
  onNextMonth: () => void;

  // Handlers
  onOpenEdit: (task: ProjectTaskItemDTO) => void;
  onAddTask?: (status?: string) => void;
  onUpdateTaskStatus: (taskId: string, status: string) => void;
  onDropTask: (taskId: string, newDate: string) => Promise<void>;

  // Selection
  selectedTaskIds: Set<string>;
  selectedVisibleCount: number;
  onSelectTask: (
    taskId: string,
    event?: React.MouseEvent | React.KeyboardEvent | React.ChangeEvent,
  ) => void;
  toggleSelectAllVisible: () => void;

  // Board DnD
  isDragDropLocked: boolean;
  dragOverColumn: string | null;
  setDragOverColumn: (col: string | null) => void;
  draggedTaskId: string | null;
  handleDragStart: (event: React.DragEvent<HTMLElement>, taskId: string) => void;
  handleDragOver: (event: React.DragEvent<HTMLElement>) => void;
  handleDrop: (event: React.DragEvent<HTMLElement>, status: string) => void;
  handleDropByPosition: (
    event: React.DragEvent<HTMLElement>,
    status: string,
    targetTaskId?: string,
  ) => void;
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
  onAddTask,
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
    if (onAddTask) {
      onAddTask(status);
    } else {
      setTaskStatus(status);
      setShowCreateTaskPanel(true);
    }
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
        <NeuralBriefing projectId={projectId} />
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

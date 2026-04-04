import { useState } from 'react';
import type { ProjectDetailDTO, ProjectTaskItemDTO } from '@superboard/shared';
import { buildFractionalTaskPosition } from '@/lib/helpers/task-view';

interface UseTaskDragDropProps {
  project: ProjectDetailDTO | null | undefined;
  boardData: Map<string, ProjectTaskItemDTO[]>;
  isDragDropLocked: boolean;
  updateTaskStatus: (input: {
    taskId: string;
    status: ProjectTaskItemDTO['status'];
    position?: string;
  }) => Promise<void>;
  setTaskUpdateError: (error: string | null) => void;
  isUpdatePending: boolean;
}

export function useTaskDragDrop({
  project,
  boardData,
  isDragDropLocked,
  updateTaskStatus,
  setTaskUpdateError,
  isUpdatePending,
}: UseTaskDragDropProps) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  function handleDragStart(event: React.DragEvent<HTMLElement>, taskId: string) {
    if (isDragDropLocked) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData('text/task-id', taskId);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    if (isDragDropLocked) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function buildDropPosition(
    status: ProjectTaskItemDTO['status'],
    draggedTaskId: string,
    targetTaskId?: string,
  ): { position: string; requiresRebalance: boolean } {
    const tasksInTargetColumn = (boardData.get(status) ?? []).filter(
      (task: ProjectTaskItemDTO) => task.id !== draggedTaskId,
    );

    if (!targetTaskId) {
      const previousTask = tasksInTargetColumn[tasksInTargetColumn.length - 1];
      return buildFractionalTaskPosition({
        previousPosition: previousTask?.position,
      });
    }

    const targetIndex = tasksInTargetColumn.findIndex(
      (task: ProjectTaskItemDTO) => task.id === targetTaskId,
    );
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

  async function rebalanceColumnAfterDrop(input: {
    status: ProjectTaskItemDTO['status'];
    draggedTaskId: string;
    targetTaskId?: string;
  }) {
    const tasksInTargetColumn = (boardData.get(input.status) ?? []).filter(
      (task: ProjectTaskItemDTO) => task.id !== input.draggedTaskId,
    );

    const targetIndex = input.targetTaskId
      ? tasksInTargetColumn.findIndex((task: ProjectTaskItemDTO) => task.id === input.targetTaskId)
      : -1;

    const insertIndex = targetIndex === -1 ? tasksInTargetColumn.length : targetIndex;
    const reorderedTaskIds = [
      ...tasksInTargetColumn.slice(0, insertIndex).map((task: ProjectTaskItemDTO) => task.id),
      input.draggedTaskId,
      ...tasksInTargetColumn.slice(insertIndex).map((task: ProjectTaskItemDTO) => task.id),
    ];

    if (!project) {
      return;
    }

    const taskMap = new Map(project.tasks.map((task: ProjectTaskItemDTO) => [task.id, task]));

    for (let index = 0; index < reorderedTaskIds.length; index += 1) {
      const taskId = reorderedTaskIds[index]!;
      const task = taskMap.get(taskId);
      if (!task) {
        continue;
      }

      const nextPosition = String((index + 1) * 1000);
      if (task.status === input.status && task.position === nextPosition) {
        continue;
      }

      await updateTaskStatus({
        taskId,
        status: input.status,
        position: nextPosition,
      });
    }
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
    setDraggedTaskId(null);

    const taskId = event.dataTransfer.getData('text/task-id');
    if (!taskId || isUpdatePending) return;
    if (targetTaskId && taskId === targetTaskId) return;

    if (!project) return;
    const current = project.tasks.find((task) => task.id === taskId);
    if (!current) return;

    const nextDropPosition = buildDropPosition(status, taskId, targetTaskId);
    const samePosition = current.position === nextDropPosition.position;
    if (current.status === status && samePosition) {
      return;
    }

    if (nextDropPosition.requiresRebalance) {
      void rebalanceColumnAfterDrop({
        status,
        draggedTaskId: taskId,
        ...(targetTaskId ? { targetTaskId } : {}),
      }).catch((caughtError) => {
        setTaskUpdateError(
          caughtError instanceof Error
            ? caughtError.message
            : 'Không thể sắp xếp lại thứ tự task trong cột',
        );
      });
      return;
    }

    setTaskUpdateError(null);
    updateTaskStatus({
      taskId,
      status,
      position: nextDropPosition.position,
    }).catch((caughtError) => {
      setTaskUpdateError(
        caughtError instanceof Error ? caughtError.message : 'Không thể cập nhật trạng thái task',
      );
    });
  }

  function handleDrop(event: React.DragEvent<HTMLElement>, status: ProjectTaskItemDTO['status']) {
    handleDropByPosition(event, status);
  }

  return {
    dragOverColumn,
    setDragOverColumn,
    draggedTaskId,
    setDraggedTaskId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDropByPosition,
  };
}

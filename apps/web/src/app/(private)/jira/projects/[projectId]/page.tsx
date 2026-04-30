'use client';

import { useCallback, useMemo } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CreateTaskRequestDTO, ProjectMemberDTO } from '@superboard/shared';
import { FullPageError } from '@/components/ui/page-states';
import { useKeyboardShortcuts } from '@/lib/hooks/use-keyboard-shortcuts';
import { ProjectSkeleton } from '@/features/operations/project/components/ProjectSkeleton';

import { ProjectDetailHeader } from '@/features/operations/project/components/project-detail-header';
import { ProjectViewManager } from '@/features/operations/project/components/ProjectViewManager';
import { ProjectOverlayManager } from '@/features/operations/project/components/ProjectOverlayManager';
import { TaskCreateForm } from '@/features/operations/task/components/task-create-form';
import { TaskFilterBar } from '@/features/operations/task/components/task-filter-bar';
import { TaskBulkActionBar } from '@/features/operations/task/components/task-bulk-action-bar';
import { MissionArchitectTerminal } from '@/features/operations/project/components/MissionArchitectTerminal';

import {
  ProjectDetailProvider,
  useProjectDetailContext,
} from '@/features/operations/project/context/ProjectDetailContext';
import { useAuthSession } from '@/features/system/auth/hooks';
import { useProjectDetail } from '@/features/operations/project/hooks/use-project-detail';
import { useProjectCalendar } from '@/features/operations/project/hooks/use-project-calendar';
import { useProjectHeaderActions } from '@/features/operations/project/hooks/use-project-header-actions';
import { usePredictiveHealth } from '@/features/operations/project/hooks/use-predictive-health';
import { useTaskBulkActions } from '@/features/operations/task/hooks/use-task-bulk-actions';
import { useTaskDragDrop } from '@/features/operations/task/hooks/use-task-drag-drop';
import { useTaskEditPanel } from '@/features/operations/task/hooks/use-task-edit-panel';
import { useTaskSelection } from '@/features/operations/task/hooks/use-task-selection';
import { useProjectWorkflow } from '@/features/operations/workflow/hooks/use-workflow';
import {
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useArchiveTask,
  useRestoreTask,
  useBulkTaskOperation,
} from '@/features/operations/task/hooks/use-task-mutations';
import { useProjectUrlState } from '@/features/operations/project/hooks/use-project-url-state';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import {
  filterAndSortProjectTasks,
  buildBoardData,
} from '@/features/operations/task/utils/task-view';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  return (
    <ProjectDetailProvider projectId={projectId}>
      <ProjectDetailPageContent />
    </ProjectDetailProvider>
  );
}

function ProjectDetailPageContent() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const {
    showCreateTaskPanel,
    setShowCreateTaskPanel,
    taskStatus,
    setShowQuickSearch,
    filterQuery,
    filterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    sortDir,
    showArchived,
  } = useProjectDetailContext();

  const {
    data: project,
    isLoading: loading,
    isError,
    error: queryError,
  } = useProjectDetail(projectId, showArchived);
  const error = isError ? (queryError?.message ?? 'Không tải được dự án') : null;

  const createTaskMutation = useCreateTask(projectId);
  const bulkTaskMutation = useBulkTaskOperation(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);
  const archiveTaskMutation = useArchiveTask(projectId);
  const restoreTaskMutation = useRestoreTask(projectId);

  const { user: currentUser } = useAuthSession();

  const members: ProjectMemberDTO[] = project?.members ?? [];
  const projectKey: string | null = project?.key ?? null;

  const allowedStatuses = useMemo(() => new Set(BOARD_COLUMNS.map((column) => column.key)), []);
  const allowedPriorities = useMemo(
    () => new Set(PRIORITY_OPTIONS.map((priority) => priority.key)),
    [],
  );
  const allowedTypes = useMemo(() => new Set(TASK_TYPE_OPTIONS.map((type) => type.key)), []);

  // Sync state with URL
  useProjectUrlState({
    projectId,
    pathname,
    router,
    searchParams,
    allowedStatuses,
    allowedPriorities,
    allowedTypes,
  });

  const tasks = useMemo(() => project?.tasks ?? [], [project?.tasks]);

  const visibleTasks = useMemo(
    () =>
      filterAndSortProjectTasks(tasks, {
        assigneeId: filterAssignee,
        query: filterQuery,
        statuses: filterStatuses,
        priorities: filterPriorities,
        types: filterTypes,
        sortBy,
        sortDir,
      }),
    [
      tasks,
      filterAssignee,
      filterQuery,
      filterStatuses,
      filterPriorities,
      filterTypes,
      sortBy,
      sortDir,
    ],
  );

  const {
    selectedTaskIds,
    selectedVisibleCount,
    handleSelectTask,
    toggleSelectAllVisible,
    clearTaskSelection,
  } = useTaskSelection(tasks, visibleTasks);

  const {
    editingTask,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editType,
    setEditType,
    editStatus,
    setEditStatus,
    editPriority,
    setEditPriority,
    editStoryPoints,
    setEditStoryPoints,
    editDueDate,
    setEditDueDate,
    editAssigneeId,
    setEditAssigneeId,
    handleOpenEdit,
    handleCloseEdit,
    taskUpdateError,
    setTaskUpdateError,
    editingTaskSubtasks,
    subtaskTitle,
    setSubtaskTitle,
    subtaskError,
    subtaskPendingTaskId,
    handleCreateSubtask,
    handleToggleSubtaskDone,
    handleDeleteSubtask,
    editingParentTask,
    dialogRef,
    handleUpdateTask,
    handleDeleteTask,
    handleRestoreTask,
    handleDialogKeyDown,
  } = useTaskEditPanel({
    projectId,
    projectTasks: tasks,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
    deleteTask: archiveTaskMutation.mutateAsync,
    restoreTask: restoreTaskMutation.mutateAsync,
  });

  const {
    bulkStatus,
    setBulkStatus,
    bulkPriority,
    setBulkPriority,
    bulkAssigneeId,
    setBulkAssigneeId,
    bulkUpdatePending,
    bulkPriorityPending,
    bulkAssignPending,
    bulkDeletePending,
    handleBulkUpdateStatus,
    handleBulkAssignAssignee,
    handleBulkUpdatePriority,
    handleBulkDeleteTasks,
    isDragDropLocked,
  } = useTaskBulkActions({
    filteredTasks: visibleTasks,
    runBulkTaskOperation: bulkTaskMutation.mutateAsync,
    setTaskUpdateError,
  });

  const { viewerCount, isCopyLinkSuccess, onCopyFilterLink } = useProjectHeaderActions(projectId);

  const {
    dueTasksByDate,
    tasksWithoutDueDate,
    calendarCells,
    calendarMonthLabel,
    prevMonth,
    nextMonth,
  } = useProjectCalendar(tasks);

  const { data: workflow } = useProjectWorkflow(projectId);
  const { data: predictiveHealth } = usePredictiveHealth(projectId);

  const atRiskTaskIds = useMemo(() => {
    return new Set(
      (predictiveHealth?.predictions ?? []).filter((p) => p.isAtRisk).map((p) => p.taskId),
    );
  }, [predictiveHealth]);

  const dynamicColumns = useMemo(() => {
    if (workflow?.statuses && workflow.statuses.length > 0) {
      return workflow.statuses
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ key: s.key, label: s.name }));
    }
    return BOARD_COLUMNS;
  }, [workflow?.statuses]);

  useKeyboardShortcuts([
    { key: 'k', metaKey: true, handler: () => setShowQuickSearch(true) },
    { key: '/', handler: () => setShowQuickSearch(true) },
  ]);

  const boardDataStatuses = useMemo(() => dynamicColumns.map((col) => col.key), [dynamicColumns]);
  const boardData = useMemo(
    () => buildBoardData(visibleTasks, boardDataStatuses),
    [visibleTasks, boardDataStatuses],
  );

  const {
    dragOverColumn,
    setDragOverColumn,
    draggedTaskId,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDropByPosition,
  } = useTaskDragDrop({
    project,
    boardData,
    isDragDropLocked,
    updateTaskStatus: async (input) => {
      await updateTaskStatusMutation.mutateAsync({
        taskId: input.taskId,
        status: input.status,
        position: input.position ?? null,
      });
    },
    setTaskUpdateError,
    isUpdatePending: updateTaskStatusMutation.isPending,
  });

  const handleUpdateTaskStatusDirect = useCallback(
    async (taskId: string, status: string) => {
      await updateTaskStatusMutation.mutateAsync({ taskId, status });
    },
    [updateTaskStatusMutation],
  );

  const statusSelectLockReason = isDragDropLocked
    ? 'Đang chờ xác nhận xoá, tạm khoá chỉnh sửa'
    : updateTaskStatusMutation.isPending
      ? 'Đang cập nhật trạng thái task'
      : undefined;

  if (loading) return <ProjectSkeleton />;
  if (error || !project)
    return (
      <FullPageError
        title="Lỗi"
        message={error || 'Không tìm thấy dự án'}
        actionLabel="Thử lại"
        onAction={() => window.location.reload()}
      />
    );

  return (
    <section className="flex flex-col gap-6 p-6 min-h-screen bg-surface-bg">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <ProjectDetailHeader
            project={project!}
            projectKey={projectKey}
            viewerCount={viewerCount}
            isCopyLinkSuccess={isCopyLinkSuccess}
            onCopyFilterLink={onCopyFilterLink}
          />
          <MissionArchitectTerminal />
        </div>

        <div className="flex flex-col gap-4">
          <TaskFilterBar members={members} workflow={workflow} />

          <TaskBulkActionBar
            members={members}
            selectedCount={selectedTaskIds.size}
            selectedVisibleCount={selectedVisibleCount}
            totalVisibleCount={visibleTasks.length}
            bulkStatus={bulkStatus}
            onBulkStatusChange={setBulkStatus}
            bulkPriority={bulkPriority}
            onBulkPriorityChange={setBulkPriority}
            bulkAssigneeId={bulkAssigneeId}
            onBulkAssigneeIdChange={setBulkAssigneeId}
            isStatusPending={bulkUpdatePending}
            isPriorityPending={bulkPriorityPending}
            isAssignPending={bulkAssignPending}
            isDeletePending={bulkDeletePending}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            onClearSelection={clearTaskSelection}
            onApplyStatus={() => handleBulkUpdateStatus({ selectedTaskIds, clearTaskSelection })}
            onApplyPriority={() =>
              handleBulkUpdatePriority({ selectedTaskIds, clearTaskSelection })
            }
            onApplyAssignee={() =>
              handleBulkAssignAssignee({ selectedTaskIds, clearTaskSelection })
            }
            onDeleteSelected={() => handleBulkDeleteTasks({ selectedTaskIds, clearTaskSelection })}
            workflow={workflow}
          />
        </div>

        {showCreateTaskPanel ? (
          <TaskCreateForm
            initialStatus={taskStatus}
            onSuccess={() => setShowCreateTaskPanel(false)}
            onCancel={() => setShowCreateTaskPanel(false)}
            members={members}
            isPending={createTaskMutation.isPending}
            onCreate={async (data: CreateTaskRequestDTO) => {
              await createTaskMutation.mutateAsync(data);
            }}
            workflow={workflow}
          />
        ) : null}

        <ProjectViewManager
          projectId={projectId}
          projectKey={projectKey}
          visibleTasks={visibleTasks}
          boardData={boardData}
          dynamicColumns={dynamicColumns}
          workflow={workflow}
          atRiskTaskIds={atRiskTaskIds}
          calendarMonthLabel={calendarMonthLabel}
          calendarCells={calendarCells}
          dueTasksByDate={dueTasksByDate}
          tasksWithoutDueDate={tasksWithoutDueDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onOpenEdit={handleOpenEdit}
          onUpdateTaskStatus={handleUpdateTaskStatusDirect}
          onDropTask={async (taskId: string, newDateKey: string) => {
            await updateTaskMutation.mutateAsync({
              taskId: taskId,
              data: { dueDate: new Date(newDateKey).toISOString() },
            });
          }}
          selectedTaskIds={selectedTaskIds}
          selectedVisibleCount={selectedVisibleCount}
          onSelectTask={handleSelectTask}
          toggleSelectAllVisible={toggleSelectAllVisible}
          isDragDropLocked={isDragDropLocked}
          dragOverColumn={dragOverColumn}
          setDragOverColumn={setDragOverColumn}
          draggedTaskId={draggedTaskId}
          handleDragStart={handleDragStart}
          handleDragOver={handleDragOver}
          handleDrop={handleDrop}
          handleDropByPosition={handleDropByPosition}
          isUpdatePending={updateTaskStatusMutation.isPending}
          updatingTaskId={updateTaskStatusMutation.variables?.taskId}
          statusSelectLockReason={statusSelectLockReason}
        />

        <ProjectOverlayManager
          projectId={projectId}
          project={project}
          tasks={tasks}
          members={members}
          currentUser={currentUser}
          workflow={workflow}
          predictiveHealth={predictiveHealth}
          editingTask={editingTask}
          onCloseEdit={handleCloseEdit}
          onOpenEdit={handleOpenEdit}
          editTitle={editTitle}
          setEditTitle={setEditTitle}
          editDescription={editDescription}
          setEditDescription={setEditDescription}
          editType={editType}
          setEditType={setEditType}
          editStatus={editStatus}
          setEditStatus={setEditStatus}
          editPriority={editPriority}
          setEditPriority={setEditPriority}
          editStoryPoints={editStoryPoints}
          setEditStoryPoints={setEditStoryPoints}
          editDueDate={editDueDate}
          setEditDueDate={setEditDueDate}
          editAssigneeId={editAssigneeId}
          setEditAssigneeId={setEditAssigneeId}
          editingTaskSubtasks={editingTaskSubtasks}
          subtaskTitle={subtaskTitle}
          setSubtaskTitle={setSubtaskTitle}
          subtaskError={subtaskError}
          subtaskPendingTaskId={subtaskPendingTaskId}
          handleCreateSubtask={handleCreateSubtask}
          handleToggleSubtaskDone={handleToggleSubtaskDone}
          handleDeleteSubtask={handleDeleteSubtask}
          editingParentTask={editingParentTask}
          handleUpdateTask={handleUpdateTask}
          handleDeleteTask={handleDeleteTask}
          handleRestoreTask={handleRestoreTask}
          isSaving={updateTaskMutation.isPending}
          isDeleting={archiveTaskMutation.isPending}
          isRestoring={restoreTaskMutation.isPending}
          taskUpdateError={taskUpdateError}
          dialogRef={dialogRef}
          handleDialogKeyDown={handleDialogKeyDown}
        />
      </div>
    </section>
  );
}

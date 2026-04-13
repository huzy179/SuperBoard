'use client';

import { useCallback, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  CreateTaskRequestDTO,
  ProjectTaskItemDTO,
  ProjectMemberDTO,
} from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';
import { QuickSearchDialog } from '@/features/jira/components/quick-search-dialog';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

import { ProjectDetailHeader } from '@/features/jira/components/project-detail-header';
import { TaskBoardView } from '@/features/jira/components/task-board-view';
import { TaskListView } from '@/features/jira/components/task-list-view';
import { TaskEditSlideOver } from '@/features/jira/components/task-edit-slide-over';
import { TaskCalendarView } from '@/features/jira/components/task-calendar-view';
import { TaskCreateForm } from '@/features/jira/components/task-create-form';
import { TaskFilterBar } from '@/features/jira/components/task-filter-bar';
import { TaskBulkActionBar } from '@/features/jira/components/task-bulk-action-bar';
import { AutomationSlideOver } from '@/features/automation/components/automation-slide-over';

import { useAuthSession } from '@/features/auth/hooks';
import {
  useProjectDetail,
  useProjectCalendar,
  useProjectHeaderActions,
  useBulkTaskOperation,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useArchiveTask,
  useRestoreTask,
  useProjectUrlState,
  useTaskSelection,
  useTaskBulkActions,
  useTaskEditPanel,
  useTaskDragDrop,
  useProjectWorkflow,
  usePredictiveHealth,
} from '@/features/jira/hooks';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import {
  filterAndSortProjectTasks,
  toggleSetFilterValue,
  type TaskSortBy,
  type SortDirection,
  buildBoardData,
} from '@/lib/helpers/task-view';
import type { ViewMode } from '@/stores/jira-project-ui-store';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const [showArchived, setShowArchived] = useState(false);

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

  // Filter & View states
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const [showCreateTaskPanel, setShowCreateTaskPanel] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<Set<string>>(new Set());
  const [filterPriorities, setFilterPriorities] = useState<Set<string>>(new Set());
  const [filterTypes, setFilterTypes] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<TaskSortBy>('');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [showAutomationPanel, setShowAutomationPanel] = useState(false);

  // Sync state with URL
  useProjectUrlState({
    projectId,
    pathname,
    router,
    searchParams,
    allowedStatuses,
    allowedPriorities,
    allowedTypes,
    viewMode,
    filterQuery,
    filterAssignee,
    filterStatuses,
    filterPriorities,
    filterTypes,
    sortBy,
    sortDir,
    setViewMode,
    setFilterQuery,
    setFilterAssignee,
    setFilterStatuses,
    setFilterPriorities,
    setFilterTypes,
    setSortBy,
    setSortDir,
    showArchived,
    setShowArchived,
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
    handleDialogKeyDown,
    handleUpdateTask,
    handleDeleteTask,
    handleRestoreTask,
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

  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status'] | undefined>();
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  const { viewerCount, isCopyLinkSuccess, onCopyFilterLink, onOpenFilterInNewTab } =
    useProjectHeaderActions(projectId);

  const {
    dueTasksByDate,
    tasksWithoutDueDate,
    calendarCells,
    calendarMonthLabel,
    prevMonth,
    nextMonth,
  } = useProjectCalendar(tasks);

  const handleOpenQuickSearch = useCallback(() => setShowQuickSearch(true), []);
  const handleCloseQuickSearch = useCallback(() => setShowQuickSearch(false), []);

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
    { key: 'k', metaKey: true, handler: handleOpenQuickSearch },
    { key: '/', handler: handleOpenQuickSearch },
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

  const handleUpdateTaskStatusDirect = async (
    taskId: string,
    status: ProjectTaskItemDTO['status'],
  ) => {
    await updateTaskStatusMutation.mutateAsync({ taskId, status });
  };

  const handleToggleFilter = (key: 'status' | 'priority' | 'type', value: string) => {
    const setters = {
      status: { current: filterStatuses, setter: setFilterStatuses },
      priority: { current: filterPriorities, setter: setFilterPriorities },
      type: { current: filterTypes, setter: setFilterTypes },
    };
    const { current, setter } = setters[key];
    setter(toggleSetFilterValue(new Set(current), value));
  };

  const currentViewLabel = useMemo(() => {
    if (viewMode === 'list') return 'Danh sách';
    if (viewMode === 'calendar') return 'Lịch';
    return 'Board';
  }, [viewMode]);

  const statusSelectLockReason = isDragDropLocked
    ? 'Đang chờ xác nhận xoá, tạm khoá chỉnh sửa'
    : updateTaskStatusMutation.isPending
      ? 'Đang cập nhật trạng thái task'
      : undefined;

  if (loading) return <FullPageLoader label="Đang tải..." />;
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
    <section className="flex flex-col gap-6 p-6">
      <ProjectDetailHeader
        project={project}
        projectKey={projectKey}
        currentViewLabel={currentViewLabel}
        viewMode={viewMode}
        setViewMode={setViewMode}
        viewerCount={viewerCount}
        setShowCreateTaskPanel={setShowCreateTaskPanel}
        isCopyLinkSuccess={isCopyLinkSuccess}
        onCopyFilterLink={onCopyFilterLink}
        onOpenFilterInNewTab={onOpenFilterInNewTab}
        onOpenAutomation={() => setShowAutomationPanel(true)}
      />

      <div className="flex flex-col gap-4">
        <TaskFilterBar
          members={members}
          filterQuery={filterQuery}
          onFilterQueryChange={setFilterQuery}
          filterAssignee={filterAssignee}
          onFilterAssigneeChange={setFilterAssignee}
          filterStatuses={filterStatuses}
          onToggleStatus={(val) => handleToggleFilter('status', val)}
          filterPriorities={filterPriorities}
          onTogglePriority={(val) => handleToggleFilter('priority', val)}
          filterTypes={filterTypes}
          onToggleType={(val) => handleToggleFilter('type', val)}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortDir={sortDir}
          onToggleSortDir={() => setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          hasActiveFilters={
            filterStatuses.size > 0 ||
            filterPriorities.size > 0 ||
            filterTypes.size > 0 ||
            !!filterAssignee ||
            !!filterQuery
          }
          onClearFilters={() => {
            setFilterStatuses(new Set());
            setFilterPriorities(new Set());
            setFilterTypes(new Set());
            setFilterAssignee('');
            setFilterQuery('');
            setShowArchived(false);
          }}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived((prev) => !prev)}
          workflow={workflow}
        />

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
          isTypePending={bulkTypePending}
          isDueDatePending={bulkDueDatePending}
          isAssignPending={bulkAssignPending}
          isDeletePending={bulkDeletePending}
          onToggleSelectAllVisible={toggleSelectAllVisible}
          onClearSelection={clearTaskSelection}
          onApplyStatus={() => handleBulkUpdateStatus({ selectedTaskIds, clearTaskSelection })}
          onApplyPriority={() => handleBulkUpdatePriority({ selectedTaskIds, clearTaskSelection })}
          onApplyAssignee={() => handleBulkAssignAssignee({ selectedTaskIds, clearTaskSelection })}
          onDeleteSelected={() => handleBulkDeleteTasks({ selectedTaskIds, clearTaskSelection })}
          workflow={workflow}
        />
      </div>

      {showCreateTaskPanel ? (
        <div className="rounded-xl border border-brand-100 bg-brand-50/30 p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
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
        </div>
      ) : null}

      {viewMode === 'board' ? (
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
          onOpenEdit={handleOpenEdit}
          selectedTaskIds={selectedTaskIds}
          onSelectTask={handleSelectTask}
          isUpdatePending={updateTaskStatusMutation.isPending}
          updatingTaskId={updateTaskStatusMutation.variables?.taskId}
          onAddTask={(status) => {
            setTaskStatus(status);
            setShowCreateTaskPanel(true);
          }}
          columns={dynamicColumns}
          workflow={workflow}
          draggedTaskId={draggedTaskId}
          atRiskTaskIds={atRiskTaskIds}
        />
      ) : viewMode === 'list' ? (
        <TaskListView
          visibleTasks={visibleTasks}
          projectKey={projectKey}
          selectedTaskIds={selectedTaskIds}
          selectedVisibleCount={selectedVisibleCount}
          onSelectTask={handleSelectTask}
          toggleSelectAllVisible={toggleSelectAllVisible}
          onOpenEdit={handleOpenEdit}
          onUpdateTaskStatus={handleUpdateTaskStatusDirect}
          isUpdatePending={updateTaskStatusMutation.isPending}
          isDragDropLocked={isDragDropLocked}
          statusSelectLockReason={statusSelectLockReason}
          workflow={workflow}
        />
      ) : (
        <TaskCalendarView
          calendarMonthLabel={calendarMonthLabel}
          calendarCells={calendarCells}
          dueTasksByDate={dueTasksByDate}
          tasksWithoutDueDate={tasksWithoutDueDate}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onOpenEdit={handleOpenEdit}
          workflow={workflow}
        />
      )}

      {editingTask ? (
        <TaskEditSlideOver
          editingTask={editingTask}
          projectKey={projectKey}
          projectId={projectId}
          currentUserId={currentUser?.id ?? ''}
          members={members}
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
          onClose={handleCloseEdit}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
          onRestore={handleRestoreTask}
          isSaving={updateTaskMutation.isPending}
          isDeleting={archiveTaskMutation.isPending}
          isRestoring={restoreTaskMutation.isPending}
          taskUpdateError={taskUpdateError}
          handleOpenEdit={handleOpenEdit}
          dialogRef={dialogRef}
          handleDialogKeyDown={handleDialogKeyDown}
          workflow={workflow}
          predictiveHealth={predictiveHealth}
        />
      ) : null}

      {showQuickSearch ? (
        <QuickSearchDialog
          tasks={tasks}
          projectId={projectId}
          onClose={handleCloseQuickSearch}
          onSelectTask={(taskId) => {
            setShowQuickSearch(false);
            const task = tasks.find((t) => t.id === taskId);
            if (task) handleOpenEdit(task);
          }}
        />
      ) : null}

      {showAutomationPanel && (
        <AutomationSlideOver
          workspaceId={project?.workspaceId ?? ''}
          projectId={projectId}
          onClose={() => setShowAutomationPanel(false)}
        />
      )}
    </section>
  );
}

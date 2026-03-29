'use client';

import { useMemo, useState } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import type {
  CreateTaskRequestDTO,
  ProjectTaskItemDTO,
  ProjectMemberDTO,
} from '@superboard/shared';
import { FullPageError, FullPageLoader } from '@/components/ui/page-states';

import { ProjectDetailHeader } from '@/components/jira/project-detail-header';
import { TaskBoardView } from '@/components/jira/task-board-view';
import { TaskListView } from '@/components/jira/task-list-view';
import { TaskEditSlideOver } from '@/components/jira/task-edit-slide-over';
import { TaskCalendarView } from '@/components/jira/task-calendar-view';
import { TaskCreateForm } from '@/components/jira/task-create-form';
import { TaskFilterBar } from '@/components/jira/task-filter-bar';
import { TaskBulkActionBar } from '@/components/jira/task-bulk-action-bar';

import { useAuthSession } from '@/hooks/use-auth-session';
import { useProjectDetail } from '@/hooks/use-project-detail';
import { useProjectCalendar } from '@/hooks/use-project-calendar';
import { useProjectHeaderActions } from '@/hooks/use-project-header-actions';
import {
  useBulkTaskOperation,
  useCreateTask,
  useUpdateTask,
  useUpdateTaskStatus,
  useDeleteTask,
} from '@/hooks/use-task-mutations';
import { BOARD_COLUMNS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/lib/constants/task';
import {
  filterAndSortProjectTasks,
  toggleSetFilterValue,
  type TaskSortBy,
  type SortDirection,
  buildBoardData,
} from '@/lib/helpers/task-view';
import { useProjectUrlState } from '@/hooks/use-project-url-state';
import { useTaskSelection } from '@/hooks/use-task-selection';
import { useTaskBulkActions } from '@/hooks/use-task-bulk-actions';
import { useTaskEditPanel } from '@/hooks/use-task-edit-panel';
import { useTaskDragDrop } from '@/hooks/use-task-drag-drop';
import type { ViewMode } from '@/stores/jira-project-ui-store';

export default function ProjectDetailPage() {
  const params = useParams<{ projectId: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectId;

  const {
    data: project,
    isLoading: loading,
    isError,
    error: queryError,
  } = useProjectDetail(projectId);
  const error = isError ? (queryError?.message ?? 'Không tải được dự án') : null;

  const createTaskMutation = useCreateTask(projectId);
  const bulkTaskMutation = useBulkTaskOperation(projectId);
  const updateTaskMutation = useUpdateTask(projectId);
  const updateTaskStatusMutation = useUpdateTaskStatus(projectId);
  const deleteTaskMutation = useDeleteTask(projectId);

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
    toggleTaskSelection,
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
  } = useTaskEditPanel({
    projectId,
    projectTasks: tasks,
    createTask: createTaskMutation.mutateAsync,
    updateTask: updateTaskMutation.mutateAsync,
    updateTaskStatus: updateTaskStatusMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
  });

  const {
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
    handleBulkUpdateStatus,
    handleBulkAssignAssignee,
    handleBulkUpdatePriority,
    handleBulkUpdateType,
    handleBulkUpdateDueDate,
    handleBulkDeleteTasks,
    isDragDropLocked,
  } = useTaskBulkActions({
    filteredTasks: visibleTasks,
    runBulkTaskOperation: bulkTaskMutation.mutateAsync,
    setTaskUpdateError,
  });

  const [taskStatus, setTaskStatus] = useState<ProjectTaskItemDTO['status'] | undefined>();

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

  const boardDataStatuses = useMemo(() => BOARD_COLUMNS.map((col) => col.key), []);
  const boardData = useMemo(
    () => buildBoardData(visibleTasks, boardDataStatuses),
    [visibleTasks, boardDataStatuses],
  );

  const {
    dragOverColumn,
    setDragOverColumn,
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
    try {
      await updateTaskStatusMutation.mutateAsync({ taskId, status });
    } catch (err) {
      console.error('Failed to update status:', err);
    }
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
          }}
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
          bulkType={bulkType}
          onBulkTypeChange={setBulkType}
          bulkDueDate={bulkDueDate}
          onBulkDueDateChange={setBulkDueDate}
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
          onApplyType={() => handleBulkUpdateType({ selectedTaskIds, clearTaskSelection })}
          onApplyDueDate={() => handleBulkUpdateDueDate({ selectedTaskIds, clearTaskSelection })}
          onApplyAssignee={() => handleBulkAssignAssignee({ selectedTaskIds, clearTaskSelection })}
          onDeleteSelected={() => handleBulkDeleteTasks({ selectedTaskIds, clearTaskSelection })}
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
          toggleTaskSelection={toggleTaskSelection}
          isUpdatePending={updateTaskStatusMutation.isPending}
          updatingTaskId={updateTaskStatusMutation.variables?.taskId}
          onAddTask={(status) => {
            setTaskStatus(status);
            setShowCreateTaskPanel(true);
          }}
        />
      ) : viewMode === 'list' ? (
        <TaskListView
          visibleTasks={visibleTasks}
          projectKey={projectKey}
          selectedTaskIds={selectedTaskIds}
          selectedVisibleCount={selectedVisibleCount}
          toggleTaskSelection={toggleTaskSelection}
          toggleSelectAllVisible={toggleSelectAllVisible}
          onOpenEdit={handleOpenEdit}
          onUpdateTaskStatus={handleUpdateTaskStatusDirect}
          isUpdatePending={updateTaskStatusMutation.isPending}
          isDragDropLocked={isDragDropLocked}
          statusSelectLockReason={statusSelectLockReason}
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
          onDelete={() => {
            void handleDeleteTask();
          }}
          isSaving={updateTaskMutation.isPending}
          isDeleting={deleteTaskMutation.isPending}
          taskUpdateError={taskUpdateError}
          handleOpenEdit={handleOpenEdit}
          dialogRef={dialogRef}
          handleDialogKeyDown={handleDialogKeyDown}
        />
      ) : null}
    </section>
  );
}

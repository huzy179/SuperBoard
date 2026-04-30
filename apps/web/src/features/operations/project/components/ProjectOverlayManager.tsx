'use client';

import { TaskEditSlideOver } from '@/features/operations/task/components/task-edit-slide-over';
import { QuickSearchDialog } from './quick-search-dialog';
import dynamic from 'next/dynamic';

const AutomationSlideOver = dynamic(
  () =>
    import('@/features/specialized/automation/components/automation-slide-over').then(
      (m) => m.AutomationSlideOver,
    ),
  { ssr: false },
);

const KnowledgeMap = dynamic(
  () => import('@/features/system/search/components/knowledge-map').then((m) => m.KnowledgeMap),
  { ssr: false },
);

const ProjectCopilot = dynamic(
  () =>
    import('@/features/intelligence/ai/components/project-copilot').then((m) => m.ProjectCopilot),
  { ssr: false },
);
import { useProjectDetailContext } from '../context/ProjectDetailContext';
import type {
  ProjectTaskItemDTO,
  ProjectMemberDTO,
  ProjectItemDTO,
  TaskTypeDTO,
} from '@superboard/shared';
import type { PredictiveHealthResponse } from '@/features/operations/project/hooks/use-predictive-health';
import type { TaskPriority } from '@/lib/constants/task';

interface ProjectOverlayManagerProps {
  projectId: string;
  project: ProjectItemDTO | null;
  tasks: ProjectTaskItemDTO[];
  members: ProjectMemberDTO[];
  currentUser: { id: string } | null;
  workflow?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  predictiveHealth?: PredictiveHealthResponse | undefined;

  // States
  editingTask: ProjectTaskItemDTO | null;

  // Handlers for closing
  onCloseEdit: () => void;

  // Handlers for interaction
  onOpenEdit: (task: ProjectTaskItemDTO) => void;

  // Task Edit Panel props (passed down)
  editTitle: string;
  setEditTitle: (val: string) => void;
  editDescription: string;
  setEditDescription: (val: string) => void;
  editType: TaskTypeDTO;
  setEditType: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editStatus: ProjectTaskItemDTO['status'];
  setEditStatus: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editPriority: TaskPriority;
  setEditPriority: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editStoryPoints: string;
  setEditStoryPoints: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editDueDate: string;
  setEditDueDate: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editAssigneeId: string;
  setEditAssigneeId: (val: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  editingTaskSubtasks: ProjectTaskItemDTO[];
  subtaskTitle: string;
  setSubtaskTitle: (val: string) => void;
  subtaskError: string | null;
  subtaskPendingTaskId: string | null;
  handleCreateSubtask: (e: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleToggleSubtaskDone: (subtask: ProjectTaskItemDTO) => void;
  handleDeleteSubtask: (id: string) => void;
  editingParentTask: ProjectTaskItemDTO | null;
  handleUpdateTask: (e: any) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleDeleteTask: () => void;
  handleRestoreTask: () => void;
  isSaving: boolean;
  isDeleting: boolean;
  isRestoring: boolean;
  taskUpdateError: string | null;
  dialogRef: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  handleDialogKeyDown: (e: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export function ProjectOverlayManager({
  projectId,
  project,
  tasks,
  members,
  currentUser,
  workflow,
  predictiveHealth,
  editingTask,
  onCloseEdit,
  onOpenEdit,
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
  editingTaskSubtasks,
  subtaskTitle,
  setSubtaskTitle,
  subtaskError,
  subtaskPendingTaskId,
  handleCreateSubtask,
  handleToggleSubtaskDone,
  handleDeleteSubtask,
  editingParentTask,
  handleUpdateTask,
  handleDeleteTask,
  handleRestoreTask,
  isSaving,
  isDeleting,
  isRestoring,
  taskUpdateError,
  dialogRef,
  handleDialogKeyDown,
}: ProjectOverlayManagerProps) {
  const {
    showQuickSearch,
    setShowQuickSearch,
    showAutomationPanel,
    setShowAutomationPanel,
    showKnowledgeMap,
    setShowKnowledgeMap,
  } = useProjectDetailContext();

  const onCloseQuickSearch = () => setShowQuickSearch(false);
  const onCloseAutomation = () => setShowAutomationPanel(false);
  const onCloseKnowledgeMap = () => setShowKnowledgeMap(false);
  return (
    <>
      {editingTask ? (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="pointer-events-auto contents">
            <TaskEditSlideOver
              editingTask={editingTask}
              projectKey={project?.key ?? null}
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
              onClose={onCloseEdit}
              onSave={handleUpdateTask}
              onDelete={handleDeleteTask}
              onRestore={handleRestoreTask}
              isSaving={isSaving}
              isDeleting={isDeleting}
              isRestoring={isRestoring}
              taskUpdateError={taskUpdateError}
              handleOpenEdit={onOpenEdit}
              dialogRef={dialogRef}
              handleDialogKeyDown={handleDialogKeyDown}
              workflow={workflow}
              predictiveHealth={predictiveHealth}
              workspaceId={project?.workspaceId ?? ''}
              tasks={tasks}
            />
          </div>
        </div>
      ) : null}

      {showQuickSearch ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl">
            <QuickSearchDialog
              tasks={tasks}
              projectId={projectId}
              onClose={onCloseQuickSearch}
              onSelectTask={(taskId) => {
                onCloseQuickSearch();
                const task = tasks.find((t) => t.id === taskId);
                if (task) onOpenEdit(task);
              }}
            />
          </div>
        </div>
      ) : null}

      {showAutomationPanel ? (
        <div className="fixed inset-y-0 right-0 z-50 pointer-events-none">
          <div className="pointer-events-auto h-full">
            <AutomationSlideOver
              workspaceId={project?.workspaceId ?? ''}
              projectId={projectId}
              onClose={onCloseAutomation}
            />
          </div>
        </div>
      ) : null}

      {showKnowledgeMap ? (
        <div className="fixed inset-0 z-[60]">
          <KnowledgeMap
            projectId={projectId}
            onClose={onCloseKnowledgeMap}
            onSelectNode={(nodeId, type) => {
              if (type === 'task') {
                const task = tasks.find((t) => t.id === nodeId);
                if (task) {
                  onCloseKnowledgeMap();
                  onOpenEdit(task);
                }
              }
            }}
          />
        </div>
      ) : null}

      <ProjectCopilot projectId={projectId} />
    </>
  );
}

import type { Project } from '../types/project.types';
import type { ApiResponse } from '../types/common.types';

export type ProjectItemDTO = Pick<
  Project,
  'id' | 'name' | 'description' | 'color' | 'icon' | 'key' | 'createdAt' | 'updatedAt'
> & {
  taskCount: number;
  doneTaskCount: number;
  deletedAt?: string | null;
};

export type ProjectsResponseDTO = ApiResponse<ProjectItemDTO[]>;

export type TaskPriorityDTO = 'low' | 'medium' | 'high' | 'urgent';

export type TaskTypeDTO = 'task' | 'bug' | 'story' | 'epic';

export type TaskStatusDTO = string;

export type TaskEventTypeDTO =
  | 'created'
  | 'updated'
  | 'status_changed'
  | 'assignee_changed'
  | 'comment_added';

export type TaskEventActionDTO =
  | 'task_updated'
  | 'task_deleted'
  | 'bulk_delete'
  | 'bulk_update'
  | 'comment_updated'
  | 'comment_deleted';

export interface LabelDTO {
  id: string;
  name: string;
  color: string;
}

export interface ProjectMemberDTO {
  id: string;
  fullName: string;
  avatarColor?: string | null;
}

export interface ProjectTaskAttachmentDTO {
  id: string;
  name: string;
  key: string;
  url: string;
  size: number;
  mimeType: string;
  createdAt: string;
  aiContext?: string;
}

export interface ProjectTaskItemDTO {
  id: string;
  projectId: string;
  projectName?: string | null;
  title: string;
  description?: string | null;
  parentTaskId?: string | null;
  parentTaskTitle?: string | null;
  status: TaskStatusDTO;
  priority: TaskPriorityDTO;
  type: TaskTypeDTO;
  number?: number | null;
  storyPoints?: number | null;
  position?: string | null;
  labels: LabelDTO[];
  dueDate?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeAvatarColor?: string | null;
  subtaskProgress?: {
    total: number;
    done: number;
    percent: number;
  } | null;
  attachments: ProjectTaskAttachmentDTO[];
  summary?: string | null;
  recentCollaborators?: string[];
  aiSuggestions?: {
    priority?: TaskPriorityDTO | null;
    labels?: string[] | null;
    similarTasks?: { id: string; title: string; score: number }[] | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ProjectDetailDTO extends ProjectItemDTO {
  tasks: ProjectTaskItemDTO[];
  members: ProjectMemberDTO[];
}

export type ProjectDetailResponseDTO = ApiResponse<ProjectDetailDTO>;

export interface CreateTaskRequestDTO {
  title: string;
  description?: string;
  parentTaskId?: string | null;
  status?: TaskStatusDTO;
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  storyPoints?: number | null;
  labelIds?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type CreateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskStatusRequestDTO {
  status: TaskStatusDTO;
  position?: string | null;
}

export type UpdateTaskStatusResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskRequestDTO {
  title?: string;
  description?: string;
  parentTaskId?: string | null;
  status?: TaskStatusDTO;
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  storyPoints?: number | null;
  position?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type UpdateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface BulkTaskOperationRequestDTO {
  taskIds: string[];
  status?: TaskStatusDTO;
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
  delete?: boolean;
}

export interface BulkTaskOperationResultDTO {
  updated: number;
  deleted: number;
}

export type BulkTaskOperationResponseDTO = ApiResponse<BulkTaskOperationResultDTO>;

export type DeleteTaskResponseDTO = ApiResponse<{ deleted: boolean }>;

export interface CreateProjectRequestDTO {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type CreateProjectResponseDTO = ApiResponse<ProjectItemDTO>;

export interface UpdateProjectRequestDTO {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

export type UpdateProjectResponseDTO = ApiResponse<ProjectItemDTO>;

export type DeleteProjectResponseDTO = ApiResponse<{ deleted: boolean }>;

// Comment DTOs

export interface CommentItemDTO {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentRequestDTO {
  content: string;
}

export interface UpdateCommentRequestDTO {
  content: string;
}

export type CommentListResponseDTO = ApiResponse<CommentItemDTO[]>;

export type CreateCommentResponseDTO = ApiResponse<CommentItemDTO>;

export type UpdateCommentResponseDTO = ApiResponse<CommentItemDTO>;

export type DeleteCommentResponseDTO = ApiResponse<{ deleted: boolean }>;

export interface TaskHistoryPayloadDTO {
  action?: TaskEventActionDTO;
  from?: string | null;
  to?: string | null;
  changedFields?: Array<
    | 'title'
    | 'description'
    | 'priority'
    | 'type'
    | 'storyPoints'
    | 'dueDate'
    | 'assigneeId'
    | 'parentTaskId'
    | 'labelIds'
  >;
  status?: TaskStatusDTO;
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  dueDate?: string | null;
  assigneeId?: string | null;
  commentId?: string;
  deletedAt?: string;
  title?: string;
}

export interface TaskHistoryItemDTO {
  id: string;
  type: TaskEventTypeDTO;
  actorId?: string | null;
  actorName?: string | null;
  createdAt: string;
  payload?: TaskHistoryPayloadDTO | null;
}

export type TaskHistoryResponseDTO = ApiResponse<TaskHistoryItemDTO[]>;

// Dashboard DTOs

export interface DashboardStatsDTO {
  tasksByStatus: { status: TaskStatusDTO; count: number }[];
  tasksByPriority: { priority: TaskPriorityDTO; count: number }[];
  tasksByType: { type: TaskTypeDTO; count: number }[];
  tasksByAssignee: {
    assigneeId: string;
    assigneeName: string;
    avatarColor: string | null;
    count: number;
  }[];
  tasksByProject: {
    projectId: string;
    projectName: string;
    projectKey: string | null;
    color: string | null;
    total: number;
    done: number;
  }[];
  overdueTasks: number;
  recentActivity: {
    id: string;
    type: TaskEventTypeDTO;
    taskTitle: string;
    actorName: string | null;
    createdAt: string;
  }[];
}

export type DashboardStatsResponseDTO = ApiResponse<DashboardStatsDTO>;

// Project Reporting DTOs

export interface VelocityPointDTO {
  label: string;
  points: number;
  taskCount: number;
}

export interface StatusDistributionDTO {
  status: string;
  count: number;
  color?: string;
}

export interface AssigneeWorkloadDTO {
  assigneeId: string;
  assigneeName: string;
  count: number;
}

export interface HealthMetricsDTO {
  overdueCount: number;
  unassignedCount: number;
  staleCount: number;
  totalTasks: number;
}

export interface BurndownPointDTO {
  date: string;
  remainingPoints: number;
  idealPoints: number;
}

export interface CumulativeFlowPointDTO {
  date: string;
  [status: string]: number | string; // status name -> count
}

export interface ProjectReportDTO {
  velocity: VelocityPointDTO[];
  distribution: StatusDistributionDTO[];
  workload: AssigneeWorkloadDTO[];
  health: HealthMetricsDTO;
  burndown: BurndownPointDTO[];
  cumulativeFlow: CumulativeFlowPointDTO[];
  metrics: {
    avgCycleTimeDays: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    completionRate: number;
    activeTaskCount: number;
  };
}

export type ProjectReportResponseDTO = ApiResponse<ProjectReportDTO>;

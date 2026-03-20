import type { Project } from '../types/project.types';
import type { ApiResponse } from '../types/common.types';

export type ProjectItemDTO = Pick<
  Project,
  'id' | 'name' | 'description' | 'color' | 'icon' | 'key' | 'createdAt' | 'updatedAt'
> & {
  taskCount: number;
  doneTaskCount: number;
};

export type ProjectsResponseDTO = ApiResponse<ProjectItemDTO[]>;

export type TaskPriorityDTO = 'low' | 'medium' | 'high' | 'urgent';

export type TaskTypeDTO = 'task' | 'bug' | 'story' | 'epic';

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

export interface ProjectTaskItemDTO {
  id: string;
  title: string;
  description?: string | null;
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority: TaskPriorityDTO;
  type: TaskTypeDTO;
  number?: number | null;
  storyPoints?: number | null;
  labels: LabelDTO[];
  dueDate?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  assigneeAvatarColor?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailDTO extends ProjectItemDTO {
  tasks: ProjectTaskItemDTO[];
  members: ProjectMemberDTO[];
}

export type ProjectDetailResponseDTO = ApiResponse<ProjectDetailDTO>;

export interface CreateTaskRequestDTO {
  title: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  storyPoints?: number | null;
  labelIds?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type CreateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskStatusRequestDTO {
  status: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
}

export type UpdateTaskStatusResponseDTO = ApiResponse<ProjectTaskItemDTO>;

export interface UpdateTaskRequestDTO {
  title?: string;
  description?: string;
  status?: 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled';
  priority?: TaskPriorityDTO;
  type?: TaskTypeDTO;
  storyPoints?: number | null;
  labelIds?: string[];
  dueDate?: string | null;
  assigneeId?: string | null;
}

export type UpdateTaskResponseDTO = ApiResponse<ProjectTaskItemDTO>;

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

export type ArchiveProjectResponseDTO = ApiResponse<{ archived: boolean }>;

export type RestoreProjectResponseDTO = ApiResponse<{ archived: boolean }>;

export type ArchiveTaskResponseDTO = ApiResponse<{ archived: boolean }>;

export type RestoreTaskResponseDTO = ApiResponse<{ archived: boolean }>;

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

// Dashboard DTOs

export interface DashboardStatsDTO {
  tasksByStatus: { status: string; count: number }[];
  tasksByPriority: { priority: string; count: number }[];
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
    type: string;
    taskTitle: string;
    actorName: string | null;
    createdAt: string;
  }[];
}

export type DashboardStatsResponseDTO = ApiResponse<DashboardStatsDTO>;

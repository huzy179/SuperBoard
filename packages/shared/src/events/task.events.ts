export interface TaskCreatedPayload {
  taskId: string;
  title: string;
  projectId: string;
  workspaceId: string;
  assigneeId?: string;
  creatorId: string;
  priority?: string;
  labels?: string[];
}

export interface TaskUpdatedPayload {
  taskId: string;
  projectId: string;
  workspaceId: string;
  updatedBy: string;
  changes: Record<string, unknown>;
}

export interface TaskStatusChangedPayload {
  taskId: string;
  projectId: string;
  workspaceId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
}

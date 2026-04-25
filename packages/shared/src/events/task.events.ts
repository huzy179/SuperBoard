import type { DomainEvent } from './base.event';

// Event type constants
export const TASK_CREATED = 'task.created' as const;
export const TASK_UPDATED = 'task.updated' as const;
export const TASK_STATUS_CHANGED = 'task.status_changed' as const;

// Event version & producer
export const TASK_EVENT_VERSION = '1.0' as const;
export const TASK_EVENT_PRODUCER = 'core-api' as const;

// Payload types
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

// Typed event interfaces
export type TaskCreatedEvent = DomainEvent<TaskCreatedPayload>;
export type TaskUpdatedEvent = DomainEvent<TaskUpdatedPayload>;
export type TaskStatusChangedEvent = DomainEvent<TaskStatusChangedPayload>;

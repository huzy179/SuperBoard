import type { DomainEvent } from './base.event';

// Event type constants
export const PROJECT_UPDATED = 'project.updated' as const;

// Event version & producer
export const PROJECT_EVENT_VERSION = '1.0' as const;
export const PROJECT_EVENT_PRODUCER = 'core-api' as const;

// Payload types
export interface ProjectUpdatedPayload {
  projectId: string;
  workspaceId: string;
  updatedBy: string;
  changes: Record<string, unknown>;
}

// Typed event interfaces
export type ProjectUpdatedEvent = DomainEvent<ProjectUpdatedPayload>;

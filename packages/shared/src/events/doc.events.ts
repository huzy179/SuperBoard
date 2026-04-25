import type { DomainEvent } from './base.event';

// Event type constants
export const DOC_UPDATED = 'doc.updated' as const;
export const DOC_VERSION_CREATED = 'doc.version_created' as const;

// Event version & producer
export const DOC_EVENT_VERSION = '1.0' as const;
export const DOC_EVENT_PRODUCER = 'core-api' as const;

// Payload types
export interface DocUpdatedPayload {
  docId: string;
  projectId: string;
  workspaceId: string;
  updatedBy: string;
  changeType: 'content' | 'title' | 'metadata';
}

export interface DocVersionCreatedPayload {
  docId: string;
  versionId: string;
  projectId: string;
  workspaceId: string;
  createdBy: string;
}

// Typed event interfaces
export type DocUpdatedEvent = DomainEvent<DocUpdatedPayload>;
export type DocVersionCreatedEvent = DomainEvent<DocVersionCreatedPayload>;

import type { DomainEvent } from './base.event';

// Event type constants
export const USER_INVITED = 'user.invited' as const;
export const USER_MEMBER_JOINED = 'user.member_joined' as const;

// Event version & producer
export const USER_EVENT_VERSION = '1.0' as const;
export const USER_EVENT_PRODUCER = 'core-api' as const;

// Payload types
export interface UserInvitedPayload {
  inviteeEmail: string;
  inviterId: string;
  workspaceId: string;
  workspaceName: string;
  token: string;
}

export interface UserMemberJoinedPayload {
  userId: string;
  workspaceId: string;
  role: string;
  joinedAt: string;
}

// Typed event interfaces
export type UserInvitedEvent = DomainEvent<UserInvitedPayload>;
export type UserMemberJoinedEvent = DomainEvent<UserMemberJoinedPayload>;

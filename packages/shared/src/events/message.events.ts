import type { DomainEvent } from './base.event';

// Event type constants
export const MESSAGE_SENT = 'message.sent' as const;
export const MESSAGE_REACTION_ADDED = 'message.reaction_added' as const;

// Event version & producer
export const MESSAGE_EVENT_VERSION = '1.0' as const;
export const MESSAGE_EVENT_PRODUCER = 'core-api' as const;

// Payload types
export interface MessageSentPayload {
  messageId: string;
  channelId: string;
  workspaceId: string;
  senderId: string;
  content: string;
}

export interface MessageReactionAddedPayload {
  messageId: string;
  channelId: string;
  workspaceId: string;
  userId: string;
  emoji: string;
}

// Typed event interfaces
export type MessageSentEvent = DomainEvent<MessageSentPayload>;
export type MessageReactionAddedEvent = DomainEvent<MessageReactionAddedPayload>;

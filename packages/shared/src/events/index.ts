import type { Doc, Message, Task } from '../types';

export type WebSocketEventMap = {
  'task.created': Task;
  'task.updated': Task;
  'task.deleted': { id: string; workspaceId: string };
  'message.created': Message;
  'doc.updated': Doc;
  'presence.updated': { userId: string; workspaceId: string; online: boolean };
};

export type WebSocketEventName = keyof WebSocketEventMap;

export type WebSocketEnvelope<TEvent extends WebSocketEventName = WebSocketEventName> = {
  event: TEvent;
  payload: WebSocketEventMap[TEvent];
  emittedAt: string;
};

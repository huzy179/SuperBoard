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

import type { Channel, ChannelMember, Message, ChannelType } from '@superboard/shared';
import { apiGet, apiPost } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getWorkspaceChannels(workspaceId: string): Promise<Channel[]> {
  return apiGet<Channel[]>(API_ENDPOINTS.chat.channels(workspaceId), { auth: true });
}

export async function createChannel(
  workspaceId: string,
  data: { name: string; description?: string; type: ChannelType },
): Promise<Channel> {
  return apiPost<Channel>(API_ENDPOINTS.chat.createChannel(workspaceId), data, { auth: true });
}

export async function joinChannel(channelId: string): Promise<ChannelMember> {
  return apiPost<ChannelMember>(API_ENDPOINTS.chat.joinChannel(channelId), {}, { auth: true });
}

export async function getChannelMessages(
  channelId: string,
  cursor?: string,
  limit?: number,
): Promise<{ items: Message[]; nextCursor: string | null }> {
  let url = API_ENDPOINTS.chat.messages(channelId);
  const params = new URLSearchParams();
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  return apiGet<{ items: Message[]; nextCursor: string | null }>(url, { auth: true });
}

export async function sendMessage(
  channelId: string,
  content: string,
  parentId?: string,
): Promise<Message> {
  return apiPost<Message>(
    API_ENDPOINTS.chat.sendMessage(channelId),
    { content, parentId },
    { auth: true },
  );
}

export async function getThreadMessages(messageId: string): Promise<Message[]> {
  return apiGet<Message[]>(API_ENDPOINTS.chat.threadMessages(messageId), { auth: true });
}

export async function summarizeThread(messageId: string): Promise<{ summary: string }> {
  return apiPost<{ summary: string }>(`/ai/messages/${messageId}/summarize`, {}, { auth: true });
}

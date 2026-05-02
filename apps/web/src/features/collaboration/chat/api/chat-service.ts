import type { Channel, ChannelMember, Message, ChannelType } from '@superboard/shared';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import type { WorkspaceMemberItemDTO } from '@superboard/shared';

export async function getWorkspaceChannels(workspaceId: string): Promise<Channel[]> {
  return apiGet<Channel[]>(API_ENDPOINTS.chat.channels(workspaceId), { auth: true });
}

export async function createChannel(
  workspaceId: string,
  data: { name: string; description?: string; type: ChannelType },
): Promise<Channel> {
  return apiPost<Channel>(API_ENDPOINTS.chat.createChannel(workspaceId), data, { auth: true });
}

export async function getOrCreateDm(workspaceId: string, otherUserId: string): Promise<Channel> {
  return apiPost<Channel>(API_ENDPOINTS.chat.dm(workspaceId), { otherUserId }, { auth: true });
}

export async function findDm(workspaceId: string, otherUserId: string): Promise<Channel | null> {
  return apiGet<Channel | null>(API_ENDPOINTS.chat.findDm(workspaceId, otherUserId), {
    auth: true,
  });
}

export async function getChannelMembers(channelId: string): Promise<WorkspaceMemberItemDTO[]> {
  return apiGet<WorkspaceMemberItemDTO[]>(API_ENDPOINTS.chat.members(channelId), { auth: true });
}

export async function addChannelMember(
  channelId: string,
  userId: string,
): Promise<{ added: true }> {
  return apiPost<{ added: true }>(
    API_ENDPOINTS.chat.addMember(channelId),
    { userId },
    { auth: true },
  );
}

export async function updateChannel(
  channelId: string,
  data: { name?: string; description?: string },
): Promise<Channel> {
  return apiPut<Channel>(API_ENDPOINTS.chat.updateChannel(channelId), data, { auth: true });
}

export async function leaveChannel(channelId: string): Promise<{ left: true }> {
  return apiDelete<{ left: true }>(API_ENDPOINTS.chat.leaveChannel(channelId), { auth: true });
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
  return apiPost<{ summary: string }>(
    API_ENDPOINTS.ai.summarizeThread(messageId),
    {},
    { auth: true },
  );
}

import type { NotificationListDataDTO } from '@superboard/shared';
import { apiGet, apiRequest } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export async function getNotifications(): Promise<NotificationListDataDTO> {
  return apiGet<NotificationListDataDTO>(API_ENDPOINTS.notifications.list, { auth: true });
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(API_ENDPOINTS.notifications.markRead(id), { auth: true, method: 'PATCH' });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest(API_ENDPOINTS.notifications.markAllRead, { auth: true, method: 'PATCH' });
}

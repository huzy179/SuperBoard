import type { NotificationListDataDTO } from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export const getNotifications = () =>
  authApi.get<NotificationListDataDTO>(API_ENDPOINTS.notifications.list);

export const markNotificationRead = (id: string) =>
  authApi.patch(API_ENDPOINTS.notifications.markRead(id));

export const markAllNotificationsRead = () =>
  authApi.patch(API_ENDPOINTS.notifications.markAllRead);

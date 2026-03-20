import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationListDataDTO } from '@superboard/shared';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/services/notification-service';

export function useNotifications() {
  return useQuery<NotificationListDataDTO>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

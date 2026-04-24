import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import {
  NotificationPreferenceDTO,
  UpdateNotificationPreferenceRequestDTO,
} from '@superboard/shared';
import { toast } from 'sonner';

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ['auth', 'preferences'],
    queryFn: async () => {
      return apiGet<NotificationPreferenceDTO>(API_ENDPOINTS.auth.preferences, { auth: true });
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotificationPreferenceRequestDTO) => {
      return apiPatch<NotificationPreferenceDTO>(API_ENDPOINTS.auth.preferences, data, {
        auth: true,
      });
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['auth', 'preferences'], response);
      toast.success('Cài đặt thông báo đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật cài đặt thông báo');
    },
  });
}

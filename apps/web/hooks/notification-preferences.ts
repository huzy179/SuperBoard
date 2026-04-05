import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/api-fetch';
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
      // Endpoint: /api/v1/auth/me/preferences
      const response = await apiFetch<NotificationPreferenceDTO>(
        `${API_ENDPOINTS.baseUrl}/api/v1/auth/me/preferences`,
      );
      return response.data;
    },
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotificationPreferenceRequestDTO) => {
      return apiFetch<NotificationPreferenceDTO>(
        `${API_ENDPOINTS.baseUrl}/api/v1/auth/me/preferences`,
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      );
    },
    onSuccess: (response) => {
      queryClient.setQueryData(['auth', 'preferences'], response.data);
      toast.success('Cài đặt thông báo đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật cài đặt thông báo');
    },
  });
}

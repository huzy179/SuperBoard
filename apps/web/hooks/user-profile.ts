import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api/api-fetch';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MeResponseDTO, UpdateProfileRequestDTO } from '@superboard/shared';
import { toast } from 'sonner';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequestDTO) => {
      return apiFetch<MeResponseDTO>(API_ENDPOINTS.auth.me, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'session'], data.data);
      toast.success('Hồ sơ đã được cập nhật');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể cập nhật hồ sơ');
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      // Use the new upload/avatar endpoint
      const response = await apiFetch<{ data: { avatarUrl: string } }>(
        `${API_ENDPOINTS.baseUrl}/api/v1/upload/avatar`,
        {
          method: 'POST',
          body: formData,
          // Content-Type is handled automatically by the browser for FormData
          headers: {},
        },
      );
      return response.data.avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tải ảnh lên');
    },
  });
}

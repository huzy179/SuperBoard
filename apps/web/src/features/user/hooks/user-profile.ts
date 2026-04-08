import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPatch, apiPost } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { MeDataDTO, UpdateProfileRequestDTO } from '@superboard/shared';
import { toast } from 'sonner';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileRequestDTO) => {
      return apiPatch<MeDataDTO>(API_ENDPOINTS.auth.me, data, { auth: true });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'session'], data.user);
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
      const response = await apiPost<{ avatarUrl: string }>(API_ENDPOINTS.upload.avatar, formData, {
        auth: true,
      });
      return response.avatarUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'session'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tải ảnh lên');
    },
  });
}

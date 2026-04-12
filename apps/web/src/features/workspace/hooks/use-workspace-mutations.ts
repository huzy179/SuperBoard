import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createWorkspace } from '@/features/workspace/api/workspace-service';

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; slug?: string }) => createWorkspace(data),
    onSuccess: (newWorkspace) => {
      toast.success(`Đã tạo workspace "${newWorkspace.name}" thành công!`);
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Không thể tạo workspace');
    },
  });
}

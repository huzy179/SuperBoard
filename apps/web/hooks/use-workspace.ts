import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkspaceMemberItemDTO } from '@superboard/shared';
import { getWorkspaceMembers, updateMemberRole } from '@/lib/services/workspace-service';

export function useWorkspaceMembers(workspaceId: string | undefined) {
  return useQuery<WorkspaceMemberItemDTO[]>({
    queryKey: ['workspace-members', workspaceId],
    queryFn: () => getWorkspaceMembers(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useUpdateMemberRole(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(workspaceId!, memberId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspace-members', workspaceId] });
    },
  });
}

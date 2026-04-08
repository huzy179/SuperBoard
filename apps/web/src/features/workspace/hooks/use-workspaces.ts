import { useQuery } from '@tanstack/react-query';
import type { WorkspaceItemDTO } from '@superboard/shared';
import { getWorkspaces } from '@/features/workspace/api/workspace-service';

export function useWorkspaces() {
  return useQuery<WorkspaceItemDTO[]>({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });
}

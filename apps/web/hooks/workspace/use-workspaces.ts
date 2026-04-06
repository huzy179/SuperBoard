import { useQuery } from '@tanstack/react-query';
import type { WorkspaceItemDTO } from '@superboard/shared';
import { getWorkspaces } from '@/lib/services/workspace-service';

export function useWorkspaces() {
  return useQuery<WorkspaceItemDTO[]>({
    queryKey: ['workspaces'],
    queryFn: getWorkspaces,
  });
}

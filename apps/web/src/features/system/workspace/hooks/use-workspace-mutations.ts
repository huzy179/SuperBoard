import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { createWorkspace } from '@/features/system/workspace/api/workspace-service';

export function useCreateWorkspace() {
  return useAppMutation({
    mutationFn: (data: { name: string; slug?: string }) => createWorkspace(data),
    resource: 'Workspace',
    action: 'create',
    invalidateKeys: [['workspaces']],
  });
}

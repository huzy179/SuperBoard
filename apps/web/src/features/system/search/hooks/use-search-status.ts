import { useAppQuery } from '@/lib/hooks/use-app-query';
import { queryKeys } from '@/lib/query-keys';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export interface SearchSyncStatus {
  tasks: { total: number; indexed: number };
  projects: { total: number; indexed: number };
  docs: { total: number; indexed: number };
  isFullySynced: boolean;
}

export function useSearchStatus() {
  return useAppQuery({
    queryKey: queryKeys.search.status,
    queryFn: () => authApi.get<SearchSyncStatus>(API_ENDPOINTS.search.status),
    refetchInterval: (data) => (data?.state?.data?.isFullySynced ? 60000 : 5000), // Poll every 5s if not synced
    notifyOnError: false,
  });
}

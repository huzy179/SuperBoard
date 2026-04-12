import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';

export interface SearchSyncStatus {
  tasks: { total: number; indexed: number };
  projects: { total: number; indexed: number };
  docs: { total: number; indexed: number };
  isFullySynced: boolean;
}

export function useSearchStatus() {
  return useQuery({
    queryKey: ['search', 'status'],
    queryFn: () => apiGet<SearchSyncStatus>('/api/v1/search/status', { auth: true }),
    refetchInterval: (data) => (data?.state?.data?.isFullySynced ? 60000 : 5000), // Poll every 5s if not synced
  });
}

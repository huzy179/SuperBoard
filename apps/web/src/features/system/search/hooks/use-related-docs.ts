import { useQuery } from '@tanstack/react-query';
import { DocItemDTO } from '@superboard/shared';
import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export function useRelatedDocs(taskNumber: number | undefined, taskTitle: string | undefined) {
  return useQuery<DocItemDTO[]>({
    queryKey: ['tasks', taskNumber, 'related-docs'],
    queryFn: async () => {
      if (taskNumber === undefined || !taskTitle) return [];
      return apiGet<DocItemDTO[]>(API_ENDPOINTS.search.relatedDocs(taskNumber, taskTitle), {
        auth: true,
      });
    },
    enabled: !!taskNumber && !!taskTitle,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

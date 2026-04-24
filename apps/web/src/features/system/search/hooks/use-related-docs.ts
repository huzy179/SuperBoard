import { useQuery } from '@tanstack/react-query';
import { DocItemDTO } from '@superboard/shared';
import { apiGet } from '@/lib/api-client';

export function useRelatedDocs(taskNumber: number | undefined, taskTitle: string | undefined) {
  return useQuery<DocItemDTO[]>({
    queryKey: ['tasks', taskNumber, 'related-docs'],
    queryFn: async () => {
      if (taskNumber === undefined || !taskTitle) return [];
      const res = await apiGet<{ data: DocItemDTO[] }>(
        `/v1/search/related-docs?taskNumber=${taskNumber}&taskTitle=${encodeURIComponent(taskTitle)}`,
        { auth: true },
      );
      return res.data;
    },
    enabled: !!taskNumber && !!taskTitle,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

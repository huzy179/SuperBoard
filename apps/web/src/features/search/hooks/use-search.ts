import { useQuery } from '@tanstack/react-query';
import { SearchResponseDTO } from '@superboard/shared';
import { apiGet } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';
import { useDebounce } from '@/hooks/use-debounce';

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useQuery<SearchResponseDTO>({
    queryKey: ['search', debouncedQuery],
    queryFn: () =>
      apiGet<SearchResponseDTO>(API_ENDPOINTS.search.global(debouncedQuery), { auth: true }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000, // 1 minute
  });
}

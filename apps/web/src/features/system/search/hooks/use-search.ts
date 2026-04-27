import { SearchResponseDTO } from '@superboard/shared';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useAppQuery } from '@/lib/hooks/use-app-query';
import { queryKeys } from '@/lib/query-keys';
import { searchGlobal } from '../api/search-service';

export function useSearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);

  return useAppQuery<SearchResponseDTO>({
    queryKey: queryKeys.search.global(debouncedQuery),
    queryFn: () => searchGlobal(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 60000, // 1 minute
    notifyOnError: false,
  });
}

import type { SearchResponseDTO } from '@superboard/shared';
import { authApi } from '@/lib/api-client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

export type SearchAnswer = {
  answer: string;
  citations: { id: string; type: string; title: string }[];
};

export const searchGlobal = (query: string) =>
  authApi.get<SearchResponseDTO>(API_ENDPOINTS.search.global(query));

export const getSearchAnswer = (query: string) =>
  authApi.get<SearchAnswer>(API_ENDPOINTS.search.answer, {
    params: { q: query },
  });

export const getSearchStatus = () => authApi.get<unknown>(API_ENDPOINTS.search.status);

import { useEffect, useRef } from 'react';
import { useQuery, type QueryKey, type UseQueryOptions } from '@tanstack/react-query';
import { notify } from '@/lib/api/notification-handler';

type AppQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> = UseQueryOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey
> & {
  notifyOnError?: boolean;
  errorMessage?: string;
};

export function useAppQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(options: AppQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const { notifyOnError = true, errorMessage, ...queryOptions } = options;
  const query = useQuery<TQueryFnData, TError, TData, TQueryKey>(queryOptions);
  const lastNotifiedErrorRef = useRef<unknown>(null);

  useEffect(() => {
    if (!notifyOnError || !query.isError || !query.error) {
      if (!query.isError) {
        lastNotifiedErrorRef.current = null;
      }
      return;
    }

    if (lastNotifiedErrorRef.current === query.error) {
      return;
    }

    lastNotifiedErrorRef.current = query.error;
    notify.error(errorMessage ? new Error(errorMessage) : query.error);
  }, [errorMessage, notifyOnError, query.error, query.isError]);

  return query;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { notify, type ActionType } from '@/lib/api/notification-handler';

interface AppMutationOptions<TData, TError, TVariables, TContext> extends UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> {
  resource?: string;
  action?: ActionType;
  successMessage?: string;
  invalidateKeys?: ReadonlyArray<QueryKey>; // Support readonly keys
}

/**
 * A wrapper around useMutation that adds standardized notification and invalidation logic.
 */
export function useAppMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(options: AppMutationOptions<TData, TError, TVariables, TContext>) {
  const {
    resource,
    action,
    successMessage,
    invalidateKeys,
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  const queryClient = useQueryClient();

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onMutate: (...args) => {
      const { onMutate } = mutationOptions;
      if (onMutate) {
        return (onMutate as any)(...args);
      }
      return undefined as TContext | Promise<TContext>;
    },
    onSuccess: (...args) => {
      // 1. Show notification
      if (action && resource) {
        notify.success(action, resource, successMessage);
      } else if (successMessage) {
        notify.success('update', '', successMessage);
      }

      // 2. Invalidate queries
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => {
          void queryClient.invalidateQueries({ queryKey: key });
        });
      }

      // 3. Call original onSuccess
      if (onSuccess) {
        (onSuccess as any)(...args);
      }
    },
    onError: (...args) => {
      const [error] = args;
      // 1. Show error notification
      notify.error(error, action, resource);

      // 2. Call original onError
      if (onError) {
        (onError as any)(...args);
      }
    },
    onSettled: (...args) => {
      const { onSettled } = mutationOptions;
      if (onSettled) {
        (onSettled as any)(...args);
      }
    },
  });
}

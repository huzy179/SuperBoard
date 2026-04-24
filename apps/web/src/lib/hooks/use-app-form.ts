/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useForm,
  type UseFormProps,
  type UseFormReturn,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ZodSchema } from 'zod';

interface UseAppFormProps<
  TFieldValues extends FieldValues = FieldValues,
  TContext = any,
> extends Omit<UseFormProps<TFieldValues, TContext>, 'resolver'> {
  schema: ZodSchema<TFieldValues>;
}

/**
 * A wrapper around react-hook-form's useForm that automatically integrates zod validation.
 */
export function useAppForm<TFieldValues extends FieldValues = FieldValues, TContext = any>(
  props: UseAppFormProps<TFieldValues, TContext>,
): UseFormReturn<TFieldValues, TContext> {
  const { schema, ...formProps } = props;

  return useForm<TFieldValues, TContext>({
    ...formProps,
    resolver: zodResolver(schema as any),
  });
}

/**
 * Helper to map backend validation errors to form fields.
 * Backend returns errors in format: { details: { fieldName: 'error message' } }
 */
export function mapBackendErrorsToForm<TFieldValues extends FieldValues>(
  error: any,
  setError: (name: Path<TFieldValues>, error: { type: string; message: string }) => void,
) {
  if (error?.details) {
    Object.entries(error.details).forEach(([field, message]) => {
      setError(field as Path<TFieldValues>, {
        type: 'manual',
        message: message as string,
      });
    });
    return true;
  }
  return false;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta: {
    timestamp: string;
    correlationId?: string;
    trace?: string;
  };
}

export function apiSuccess<T>(data: T, meta?: Partial<ApiResponse<T>['meta']>): ApiResponse<T> {
  return {
    success: true,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function apiError(
  code: string,
  message: string,
  details?: unknown,
  meta?: Partial<ApiResponse<never>['meta']>,
): ApiResponse<never> {
  return {
    success: false,
    data: null as never,
    error: { code, message, details },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

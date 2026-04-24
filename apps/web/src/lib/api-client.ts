/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@superboard/shared';
import { getAccessToken } from '@/features/system/auth/utils/auth-storage';

type RequestInitOptions = {
  auth?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
};

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}

function buildUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return path.startsWith('http') ? path : `${baseUrl}${path}`;
}

function isJsonResponse(contentType: string | null): boolean {
  return contentType?.includes('application/json') ?? false;
}

export class ApiClientError extends Error {
  status: number;
  code: string | undefined;
  details: Record<string, any> | undefined;

  constructor(message: string, status: number, code?: string, details?: Record<string, any>) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export async function apiRequest<TData>(
  path: string,
  options: RequestInitOptions = {},
): Promise<TData> {
  const { auth = false, method = 'GET', body, headers } = options;

  let mergedHeaders: HeadersInit = {
    ...(headers ?? {}),
  };

  if (body !== undefined) {
    if (!(body instanceof FormData)) {
      mergedHeaders = {
        'Content-Type': 'application/json',
        ...mergedHeaders,
      };
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new ApiClientError('Missing access token', 401, 'AUTH_REQUIRED');
    }

    mergedHeaders = {
      ...mergedHeaders,
      Authorization: `Bearer ${token}`,
    };
  }

  const requestInit: RequestInit = {
    method,
    headers: mergedHeaders,
    cache: 'no-store',
  };

  if (body !== undefined) {
    requestInit.body = (body instanceof FormData ? body : JSON.stringify(body)) as BodyInit;
  }

  const response = await fetch(buildUrl(path), requestInit);

  let payload: ApiResponse<TData> | null = null;
  if (isJsonResponse(response.headers.get('content-type'))) {
    payload = (await response.json()) as ApiResponse<TData>;
  }

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const errorMessage = payload?.error?.message ?? 'Request failed';
    const errorStatus = response.status;
    const errorCode = payload?.error?.code;
    const errorDetails = payload?.error?.details as Record<string, any> | undefined;

    // Handle Rate Limiting globally for better UX
    if (errorStatus === 429 && typeof window !== 'undefined') {
      try {
        const { toast } = await import('sonner');
        toast.error(errorMessage, {
          duration: 4000,
          id: 'rate-limit-toast', // Prevent multiple identical toasts
        });
      } catch {
        // ignore
      }
    }

    throw new ApiClientError(errorMessage, errorStatus, errorCode, errorDetails);
  }

  return payload.data as TData;
}

export function apiGet<TData>(
  path: string,
  options: Omit<RequestInitOptions, 'method' | 'body'> = {},
): Promise<TData> {
  return apiRequest<TData>(path, { ...options, method: 'GET' });
}

export function apiPost<TData>(
  path: string,
  body?: unknown,
  options: Omit<RequestInitOptions, 'method' | 'body'> = {},
): Promise<TData> {
  return apiRequest<TData>(path, { ...options, method: 'POST', body });
}

export function apiPatch<TData>(
  path: string,
  body?: unknown,
  options: Omit<RequestInitOptions, 'method' | 'body'> = {},
): Promise<TData> {
  return apiRequest<TData>(path, { ...options, method: 'PATCH', body });
}

export function apiPut<TData>(
  path: string,
  body?: unknown,
  options: Omit<RequestInitOptions, 'method' | 'body'> = {},
): Promise<TData> {
  return apiRequest<TData>(path, { ...options, method: 'PUT', body });
}

export function apiDelete<TData>(path: string, options: RequestInitOptions = {}): Promise<TData> {
  return apiRequest<TData>(path, { ...options, method: 'DELETE' });
}

/**
 * Grouped API clients
 */
export const api = {
  get: <T>(path: string, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiGet<T>(path, { ...options, auth: false }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPost<T>(path, body, { ...options, auth: false }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPatch<T>(path, body, { ...options, auth: false }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPut<T>(path, body, { ...options, auth: false }),
  delete: <T>(path: string, options?: RequestInitOptions) =>
    apiDelete<T>(path, { ...options, auth: false }),
};

export const authApi = {
  get: <T>(path: string, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiGet<T>(path, { ...options, auth: true }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPost<T>(path, body, { ...options, auth: true }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPatch<T>(path, body, { ...options, auth: true }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestInitOptions, 'method' | 'body'>) =>
    apiPut<T>(path, body, { ...options, auth: true }),
  delete: <T>(path: string, options?: RequestInitOptions) =>
    apiDelete<T>(path, { ...options, auth: true }),
};

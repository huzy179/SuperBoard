/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ApiResponse } from '@superboard/shared';
import { getAccessToken } from '@/features/system/auth/utils/auth-storage';

type RequestInitOptions = {
  auth?: boolean;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | null | undefined> | URLSearchParams;
  responseType?: 'json' | 'blob' | 'text' | 'void';
  signal?: AbortSignal;
  cache?: RequestCache;
};

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;
}

function buildUrl(
  path: string,
  params?: Record<string, string | number | boolean | null | undefined> | URLSearchParams,
): string {
  const baseUrl = getApiBaseUrl();
  const url = new URL(path, baseUrl);

  if (params instanceof URLSearchParams) {
    params.forEach((value, key) => url.searchParams.append(key, value));
  } else if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return;
      }
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
}

function isJsonResponse(contentType: string | null): boolean {
  return contentType?.includes('application/json') ?? false;
}

function isFormDataBody(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isApiResponse<TData>(payload: unknown): payload is ApiResponse<TData> {
  return (
    !!payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    ('data' in payload || 'error' in payload)
  );
}

async function parseJsonResponse(response: Response): Promise<unknown | null> {
  if (!isJsonResponse(response.headers.get('content-type'))) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function resolveErrorPayload(response: Response): Promise<{
  message: string;
  code?: string | undefined;
  details?: Record<string, any> | undefined;
}> {
  const payload = await parseJsonResponse(response);

  if (isApiResponse<unknown>(payload)) {
    return {
      message: payload.error?.message ?? response.statusText ?? 'Request failed',
      code: payload.error?.code,
      details: payload.error?.details as Record<string, any> | undefined,
    };
  }

  if (payload && typeof payload === 'object') {
    const candidate = payload as { message?: unknown; error?: unknown; code?: unknown };
    const nestedError =
      candidate.error && typeof candidate.error === 'object'
        ? (candidate.error as { message?: unknown; code?: unknown; details?: unknown })
        : null;

    return {
      message:
        (typeof candidate.message === 'string' && candidate.message) ||
        (typeof nestedError?.message === 'string' && nestedError.message) ||
        response.statusText ||
        'Request failed',
      code:
        (typeof candidate.code === 'string' && candidate.code) ||
        (typeof nestedError?.code === 'string' && nestedError.code) ||
        undefined,
      details:
        nestedError?.details && typeof nestedError.details === 'object'
          ? (nestedError.details as Record<string, any>)
          : undefined,
    };
  }

  let text = '';
  try {
    text = await response.text();
  } catch {
    text = '';
  }

  return {
    message: text || response.statusText || 'Request failed',
  };
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
  const {
    auth = false,
    method = 'GET',
    body,
    headers,
    params,
    responseType = 'json',
    signal,
    cache = 'no-store',
  } = options;

  const mergedHeaders = new Headers(headers);

  if (body !== undefined) {
    if (!isFormDataBody(body) && !mergedHeaders.has('Content-Type')) {
      mergedHeaders.set('Content-Type', 'application/json');
    }
  }

  if (auth) {
    const token = getAccessToken();
    if (!token) {
      throw new ApiClientError('Missing access token', 401, 'AUTH_REQUIRED');
    }

    mergedHeaders.set('Authorization', `Bearer ${token}`);
  }

  const requestInit: RequestInit = {
    method,
    headers: mergedHeaders,
    cache,
  };

  if (signal) {
    requestInit.signal = signal;
  }

  if (body !== undefined) {
    requestInit.body = (isFormDataBody(body) ? body : JSON.stringify(body)) as BodyInit;
  }

  const response = await fetch(buildUrl(path, params), requestInit);

  if (!response.ok) {
    const error = await resolveErrorPayload(response);
    throw new ApiClientError(error.message, response.status, error.code, error.details);
  }

  if (responseType === 'void') {
    if (response.status !== 204) {
      const payload = await parseJsonResponse(response);

      if (isApiResponse<unknown>(payload) && !payload.success) {
        throw new ApiClientError(
          payload.error?.message ?? 'Request failed',
          response.status,
          payload.error?.code,
          payload.error?.details as Record<string, any> | undefined,
        );
      }
    }

    return undefined as TData;
  }

  if (responseType === 'blob') {
    return (await response.blob()) as TData;
  }

  if (responseType === 'text') {
    return (await response.text()) as TData;
  }

  if (response.status === 204) {
    return undefined as TData;
  }

  const payload = await parseJsonResponse(response);

  if (isApiResponse<TData>(payload)) {
    if (!payload.success || payload.data === undefined) {
      throw new ApiClientError(
        payload.error?.message ?? 'Request failed',
        response.status,
        payload.error?.code,
        payload.error?.details as Record<string, any> | undefined,
      );
    }

    return payload.data as TData;
  }

  return payload as TData;
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

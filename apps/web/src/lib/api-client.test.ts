import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { apiRequest, ApiClientError } from './api-client';

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function mockFetch(handler: (input: RequestInfo | URL, init?: RequestInit) => Response) {
  globalThis.fetch = ((input, init) => Promise.resolve(handler(input, init))) as typeof fetch;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) {
    delete process.env.NEXT_PUBLIC_API_URL;
  } else {
    process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
  }
});

describe('apiRequest', () => {
  it('unwraps JSON ApiResponse success payloads', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
    mockFetch(() => jsonResponse({ success: true, data: { id: '1' } }));

    const result = await apiRequest<{ id: string }>('/api/v1/projects');

    assert.deepEqual(result, { id: '1' });
  });

  it('maps error responses to ApiClientError', async () => {
    mockFetch(() =>
      jsonResponse(
        {
          success: false,
          data: null,
          error: { message: 'Invalid request', code: 'BAD_REQUEST', details: { field: 'name' } },
        },
        { status: 400 },
      ),
    );

    await assert.rejects(apiRequest('/api/v1/projects'), (error) => {
      assert.ok(error instanceof ApiClientError);
      assert.equal(error.status, 400);
      assert.equal(error.code, 'BAD_REQUEST');
      assert.deepEqual(error.details, { field: 'name' });
      assert.equal(error.message, 'Invalid request');
      return true;
    });
  });

  it('appends params without dropping existing query values', async () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://api.test';
    mockFetch((input) => {
      const url = new URL(String(input));
      assert.equal(url.pathname, '/api/v1/search');
      assert.equal(url.searchParams.get('existing'), '1');
      assert.equal(url.searchParams.get('q'), 'roadmap');
      assert.equal(url.searchParams.get('page'), '2');
      assert.equal(url.searchParams.has('empty'), false);
      return jsonResponse({ success: true, data: [] });
    });

    await apiRequest('/api/v1/search?existing=1', {
      params: { q: 'roadmap', page: 2, empty: undefined },
    });
  });

  it('does not set Content-Type for FormData bodies', async () => {
    mockFetch((_input, init) => {
      const headers = init?.headers as Headers;
      assert.equal(headers.has('content-type'), false);
      return jsonResponse({ success: true, data: { ok: true } });
    });

    const formData = new FormData();
    formData.set('file', new Blob(['hello']), 'hello.txt');

    await apiRequest('/api/v1/upload/avatar', { method: 'POST', body: formData });
  });

  it('handles void responses', async () => {
    mockFetch(() => new Response(null, { status: 204 }));

    const result = await apiRequest<void>('/api/v1/projects/1', {
      method: 'DELETE',
      responseType: 'void',
    });

    assert.equal(result, undefined);
  });

  it('handles blob responses', async () => {
    mockFetch(() => new Response('csv-data', { status: 200 }));

    const result = await apiRequest<Blob>('/api/v1/projects/1/export', {
      responseType: 'blob',
    });

    assert.equal(await result.text(), 'csv-data');
  });

  it('handles text responses', async () => {
    mockFetch(() => new Response('plain-text', { status: 200 }));

    const result = await apiRequest<string>('/api/v1/system/plain', {
      responseType: 'text',
    });

    assert.equal(result, 'plain-text');
  });
});

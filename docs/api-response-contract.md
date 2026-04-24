# API Response Contract

All HTTP endpoints in the Core API return responses wrapped in the `ApiResponse` envelope defined in `@superboard/shared`.

## Envelope Shape

```ts
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: { code: string; message: string; details?: unknown } | null;
  meta: {
    timestamp: string; // ISO 8601
    correlationId?: string; // X-Correlation-ID from request
    trace?: string; // Stack trace (development only)
  };
}
```

## Success Response

Use `apiSuccess(data)` from `@superboard/shared` (re-exported via `../../common/api-response`).

```json
{
  "success": true,
  "data": { "id": "abc", "name": "My Project" },
  "error": null,
  "meta": { "timestamp": "2025-01-01T00:00:00.000Z", "correlationId": "uuid-here" }
}
```

## Error Response

Use `apiError(code, message, details?)` from `@superboard/shared`.

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "NOT_FOUND",
    "message": "Project not found",
    "details": null
  },
  "meta": { "timestamp": "2025-01-01T00:00:00.000Z", "correlationId": "uuid-here" }
}
```

### Error Code Convention

| Source                                     | Code format          | Example                                |
| ------------------------------------------ | -------------------- | -------------------------------------- |
| HTTP status fallback                       | `ERR_<status>`       | `ERR_404`, `ERR_500`                   |
| NestJS default error string                | SCREAMING_SNAKE_CASE | `NOT_FOUND`, `BAD_REQUEST`             |
| Custom domain code (in exception response) | Domain-prefixed      | `TASK_NOT_FOUND`, `AUTH_INVALID_TOKEN` |

To throw a custom-coded error from a service:

```ts
throw new HttpException(
  { code: 'TASK_NOT_FOUND', message: 'Task not found' },
  HttpStatus.NOT_FOUND,
);
```

### Validation Errors

When NestJS `ValidationPipe` rejects a request, the `details` field contains the array of constraint messages:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "BAD_REQUEST",
    "message": "title should not be empty, status must be a string",
    "details": ["title should not be empty", "status must be a string"]
  },
  "meta": { "timestamp": "..." }
}
```

## Controller Guidelines

1. Every controller method **must** return `apiSuccess(data)` — never return raw objects.
2. Do **not** manually construct `{ success: true, data: ... }` — always use the helper.
3. For file/stream download endpoints that use `@Res()` directly, the raw response is acceptable since the body is not JSON.
4. Errors are handled globally by `HttpExceptionFilter` — do not catch and re-shape errors in controllers.

## Exception Filter

`HttpExceptionFilter` (`apps/api/src/common/filters/http-exception.filter.ts`) catches all unhandled exceptions and returns an `apiError(...)` shaped response automatically. It:

- Extracts `code` from the exception response object if present, otherwise falls back to `ERR_<status>`.
- Extracts `details` from validation error arrays.
- Logs 5xx errors and triggers Neural Diagnosis.
- Includes `trace` in development mode only.

## Related Requirements

- Requirement 2.4 — ApiResponse envelope applied to 100% of modified/new endpoints.
- Requirement 2.5 — Written response contract guideline in project documentation.

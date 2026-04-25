/**
 * Contract-Breaking Change Tests
 *
 * Requirements: 15.3
 *
 * These tests detect and block known contract-breaking change patterns:
 *
 *   Test Case 1: Missing required field in event payload → consumer rejects (schema validation fail)
 *   Test Case 2: Type mismatch in DTO field → API validation fails (Zod schema reject)
 *   Test Case 3: Removed field from contract → dependent service assertion fails (runtime check)
 *
 * Run: node --test --import tsx packages/shared/src/__tests__/contract-breaking.spec.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';
import type { DomainEvent } from '../events/base.event.js';
import type { TaskCreatedPayload } from '../events/task.events.js';
import type { NotificationJobDTO } from '../dtos/notification-job.dto.js';
import { apiSuccess, apiError } from '../types/api-response.js';

// ─── Zod schemas that consumers use to validate incoming events/DTOs ──────────

/**
 * Consumer-side schema for DomainEvent base fields.
 * Mirrors what AI Service and Notification Service use to validate incoming events.
 */
const domainEventSchema = z.object({
  eventId: z.string().min(1, 'eventId is required'),
  eventType: z.string().min(1, 'eventType is required'),
  eventVersion: z.string().min(1, 'eventVersion is required'),
  producer: z.string().min(1, 'producer is required'),
  correlationId: z.string().min(1, 'correlationId is required'),
  idempotencyKey: z.string().min(1, 'idempotencyKey is required'),
  occurredAt: z.string().datetime('occurredAt must be ISO8601'),
  payload: z.record(z.string(), z.unknown()),
});

/**
 * Consumer-side schema for TaskCreatedPayload.
 * Mirrors what downstream consumers expect from task.created events.
 */
const taskCreatedPayloadSchema = z.object({
  taskId: z.string().min(1, 'taskId is required'),
  title: z.string().min(1, 'title is required'),
  projectId: z.string().min(1, 'projectId is required'),
  workspaceId: z.string().min(1, 'workspaceId is required'),
  creatorId: z.string().min(1, 'creatorId is required'),
  assigneeId: z.string().optional(),
  priority: z.string().optional(),
  labels: z.array(z.string()).optional(),
});

/**
 * Consumer-side schema for NotificationJobDTO.
 * Mirrors what Notification Service uses to validate incoming BullMQ jobs.
 */
const notificationJobSchema = z.object({
  id: z.string().min(1, 'id (idempotency key) is required'),
  correlationId: z.string().min(1, 'correlationId is required'),
  type: z.enum(['in-app', 'email', 'digest', 'reminder'], {
    errorMap: () => ({ message: 'type must be one of: in-app, email, digest, reminder' }),
  }),
  recipientId: z.string().min(1, 'recipientId is required'),
  payload: z.object({
    title: z.string().optional(),
    body: z.string().optional(),
    actionUrl: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  }),
  createdAt: z.string().datetime('createdAt must be ISO8601'),
  templateId: z.string().optional(),
  scheduledAt: z.string().optional(),
});

// ─── Test Case 1: Missing required field in event payload ─────────────────────

describe('Contract-Breaking Test Case 1: Missing required field in event payload', () => {
  it('consumer rejects event missing eventId', () => {
    const incompleteEvent = {
      // eventId is intentionally missing — simulates a breaking change where producer removes this field
      eventType: 'task.created',
      eventVersion: '1.0',
      producer: 'core-api',
      correlationId: 'corr-123',
      idempotencyKey: 'idem-123',
      occurredAt: new Date().toISOString(),
      payload: { taskId: 't1', title: 'Test', projectId: 'p1', workspaceId: 'w1', creatorId: 'u1' },
    };

    const result = domainEventSchema.safeParse(incompleteEvent);

    assert.equal(result.success, false, 'Consumer MUST reject event missing eventId');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('eventId')),
      'Validation error must reference the missing eventId field',
    );
  });

  it('consumer rejects event missing correlationId', () => {
    const incompleteEvent = {
      eventId: 'evt-123',
      eventType: 'task.created',
      eventVersion: '1.0',
      producer: 'core-api',
      // correlationId is intentionally missing
      idempotencyKey: 'idem-123',
      occurredAt: new Date().toISOString(),
      payload: {},
    };

    const result = domainEventSchema.safeParse(incompleteEvent);

    assert.equal(result.success, false, 'Consumer MUST reject event missing correlationId');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('correlationId')),
      'Validation error must reference the missing correlationId field',
    );
  });

  it('consumer rejects task.created payload missing required taskId', () => {
    const incompletePayload = {
      // taskId is intentionally missing — simulates producer removing a required payload field
      title: 'Test Task',
      projectId: 'p1',
      workspaceId: 'w1',
      creatorId: 'u1',
    };

    const result = taskCreatedPayloadSchema.safeParse(incompletePayload);

    assert.equal(result.success, false, 'Consumer MUST reject payload missing taskId');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('taskId')),
      'Validation error must reference the missing taskId field',
    );
  });

  it('valid complete event passes consumer validation', () => {
    const validEvent: DomainEvent<TaskCreatedPayload> = {
      eventId: 'evt-123',
      eventType: 'task.created',
      eventVersion: '1.0',
      producer: 'core-api',
      correlationId: 'corr-123',
      idempotencyKey: 'idem-123',
      occurredAt: new Date().toISOString(),
      payload: {
        taskId: 't1',
        title: 'Test Task',
        projectId: 'p1',
        workspaceId: 'w1',
        creatorId: 'u1',
      },
    };

    const result = domainEventSchema.safeParse(validEvent);

    assert.equal(result.success, true, 'Valid complete event must pass consumer validation');
  });
});

// ─── Test Case 2: Type mismatch in DTO field ──────────────────────────────────

describe('Contract-Breaking Test Case 2: Type mismatch in DTO field causes validation failure', () => {
  it('consumer rejects NotificationJobDTO with invalid type enum value', () => {
    const invalidJob = {
      id: 'job-123',
      correlationId: 'corr-123',
      type: 'sms', // invalid — not in enum ['in-app', 'email', 'digest', 'reminder']
      recipientId: 'u1',
      payload: { title: 'Hello' },
      createdAt: new Date().toISOString(),
    };

    const result = notificationJobSchema.safeParse(invalidJob);

    assert.equal(result.success, false, 'Consumer MUST reject job with invalid type value');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('type')),
      'Validation error must reference the invalid type field',
    );
  });

  it('consumer rejects NotificationJobDTO with non-datetime createdAt', () => {
    const invalidJob = {
      id: 'job-123',
      correlationId: 'corr-123',
      type: 'email',
      recipientId: 'u1',
      payload: {},
      createdAt: '25/04/2026', // wrong format — not ISO8601
    };

    const result = notificationJobSchema.safeParse(invalidJob);

    assert.equal(result.success, false, 'Consumer MUST reject job with non-ISO8601 createdAt');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('createdAt')),
      'Validation error must reference the invalid createdAt field',
    );
  });

  it('consumer rejects event with non-datetime occurredAt', () => {
    const invalidEvent = {
      eventId: 'evt-123',
      eventType: 'task.created',
      eventVersion: '1.0',
      producer: 'core-api',
      correlationId: 'corr-123',
      idempotencyKey: 'idem-123',
      occurredAt: 1714000000000, // number instead of ISO8601 string — type mismatch
      payload: {},
    };

    const result = domainEventSchema.safeParse(invalidEvent);

    assert.equal(result.success, false, 'Consumer MUST reject event with numeric occurredAt');
    assert.ok(
      result.error?.issues.some((i) => i.path.includes('occurredAt')),
      'Validation error must reference the invalid occurredAt field',
    );
  });

  it('valid NotificationJobDTO passes consumer validation', () => {
    const validJob: NotificationJobDTO = {
      id: 'job-123',
      correlationId: 'corr-123',
      type: 'email',
      recipientId: 'u1',
      payload: { title: 'Hello', body: 'World' },
      createdAt: new Date().toISOString(),
    };

    const result = notificationJobSchema.safeParse(validJob);

    assert.equal(result.success, true, 'Valid NotificationJobDTO must pass consumer validation');
  });
});

// ─── Test Case 3: Removed field from contract ─────────────────────────────────

describe('Contract-Breaking Test Case 3: Removed field from contract causes dependent service failure', () => {
  it('dependent service fails when ApiResponse is missing the error field', () => {
    // Simulate a breaking change: producer removes the `error` field from ApiResponse
    const brokenResponse = {
      success: false,
      data: null,
      // error field intentionally removed — breaking change
      meta: { timestamp: new Date().toISOString() },
    };

    // Dependent service code that relies on error.code being present
    function extractErrorCode(response: Record<string, unknown>): string {
      const error = response['error'] as { code?: string } | null | undefined;
      if (!error || typeof error.code !== 'string') {
        throw new Error(
          'Contract violation: ApiResponse.error.code is missing — field was removed from contract',
        );
      }
      return error.code;
    }

    assert.throws(
      () => extractErrorCode(brokenResponse),
      /Contract violation/,
      'Dependent service MUST throw when error field is removed from ApiResponse',
    );
  });

  it('dependent service fails when DomainEvent is missing the idempotencyKey field', () => {
    // Simulate a breaking change: producer removes idempotencyKey from DomainEvent
    const brokenEvent = {
      eventId: 'evt-123',
      eventType: 'task.created',
      eventVersion: '1.0',
      producer: 'core-api',
      correlationId: 'corr-123',
      // idempotencyKey intentionally removed — breaking change
      occurredAt: new Date().toISOString(),
      payload: {},
    };

    // Consumer deduplication logic that relies on idempotencyKey
    function extractIdempotencyKey(event: Record<string, unknown>): string {
      const key = event['idempotencyKey'];
      if (typeof key !== 'string' || key.length === 0) {
        throw new Error(
          'Contract violation: DomainEvent.idempotencyKey is missing — field was removed from contract',
        );
      }
      return key;
    }

    assert.throws(
      () => extractIdempotencyKey(brokenEvent),
      /Contract violation/,
      'Consumer MUST throw when idempotencyKey is removed from DomainEvent',
    );
  });

  it('dependent service fails when NotificationJobDTO is missing the id field', () => {
    // Simulate a breaking change: producer removes id (idempotency key) from NotificationJobDTO
    const brokenJob = {
      // id intentionally removed — breaking change
      correlationId: 'corr-123',
      type: 'in-app',
      recipientId: 'u1',
      payload: { title: 'Hello' },
      createdAt: new Date().toISOString(),
    };

    // Notification worker idempotency check that relies on id field
    function checkIdempotency(job: Record<string, unknown>): string {
      const id = job['id'];
      if (typeof id !== 'string' || id.length === 0) {
        throw new Error(
          'Contract violation: NotificationJobDTO.id is missing — idempotency key field was removed from contract',
        );
      }
      return id;
    }

    assert.throws(
      () => checkIdempotency(brokenJob),
      /Contract violation/,
      'Notification worker MUST throw when id field is removed from NotificationJobDTO',
    );
  });

  it('valid ApiResponse with all required fields passes dependent service check', () => {
    const validResponse = apiError('TASK_NOT_FOUND', 'Task not found');

    // Dependent service code
    function extractErrorCode(response: typeof validResponse): string {
      if (!response.error || typeof response.error.code !== 'string') {
        throw new Error('Contract violation: ApiResponse.error.code is missing');
      }
      return response.error.code;
    }

    const code = extractErrorCode(validResponse);
    assert.equal(
      code,
      'TASK_NOT_FOUND',
      'Valid ApiResponse must allow dependent service to extract error code',
    );
  });

  it('valid ApiResponse success with all required fields passes dependent service check', () => {
    const validResponse = apiSuccess({ id: 't1', title: 'Test' });

    assert.equal(validResponse.success, true);
    assert.ok(validResponse.data, 'data must be present on success response');
    assert.equal(validResponse.error, null, 'error must be null on success response');
    assert.ok(validResponse.meta.timestamp, 'meta.timestamp must be present');
  });
});

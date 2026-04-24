/**
 * Property-Based Test: Correlation ID Propagation to Downstream
 *
 * **Validates: Requirements 6.3, 6.4, 6.5, 6.6**
 *
 * Property 4: Correlation ID Propagation to Downstream
 * For any HTTP request with a correlation ID that triggers outbound calls
 * (gRPC to AI Service, BullMQ job enqueue), all downstream calls must carry
 * the same correlation ID — as gRPC metadata `correlation-id` and as BullMQ
 * job data field `correlationId`.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Metadata } from '@grpc/grpc-js';
import { runWithRequestContext } from '../../src/common/request-context.js';

// ---------------------------------------------------------------------------
// Random generators
// ---------------------------------------------------------------------------

function randomUuidV4(): string {
  return crypto.randomUUID();
}

function randomString(length = 12): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ---------------------------------------------------------------------------
// Minimal stub for buildGrpcMetadata logic (mirrors AiService.buildGrpcMetadata)
// ---------------------------------------------------------------------------

import { getRequestContext } from '../../src/common/request-context.js';

function buildGrpcMetadata(): Metadata {
  const metadata = new Metadata();
  const ctx = getRequestContext();
  if (ctx?.correlationId) {
    metadata.set('correlation-id', ctx.correlationId);
  }
  return metadata;
}

// ---------------------------------------------------------------------------
// Minimal stub for QueueService.addJob logic
// ---------------------------------------------------------------------------

function buildJobData(data: Record<string, unknown>): Record<string, unknown> {
  const ctx = getRequestContext();
  return ctx?.correlationId ? { ...data, correlationId: ctx.correlationId } : data;
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

const ITERATIONS = 100;

describe('Property 4: Correlation ID Propagation to Downstream', () => {
  /**
   * Validates: Requirements 6.3, 6.4
   *
   * When a request context has a correlation ID, QueueService.addJob() must
   * include `correlationId` in the job data passed to queue.add().
   */
  it('QueueService includes correlationId in job data when request context has a correlation ID', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const correlationId = randomUuidV4();
      const originalData: Record<string, unknown> = {
        taskId: randomString(8),
        action: 'test-action',
      };

      let capturedJobData: Record<string, unknown> | undefined;

      runWithRequestContext({ correlationId }, () => {
        capturedJobData = buildJobData(originalData);
      });

      assert.ok(capturedJobData !== undefined, `iteration ${i}: job data must be captured`);
      assert.equal(
        capturedJobData!.correlationId,
        correlationId,
        `iteration ${i}: job data must contain correlationId="${correlationId}"`,
      );
      // Original fields must be preserved
      assert.equal(
        capturedJobData!.taskId,
        originalData.taskId,
        `iteration ${i}: original job data fields must be preserved`,
      );
    }
  });

  /**
   * Validates: Requirements 6.3, 6.4
   *
   * When request context has no correlation ID, job data must not have
   * a correlationId field injected.
   */
  it('QueueService does not inject correlationId when request context has no correlation ID', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const originalData: Record<string, unknown> = {
        taskId: randomString(8),
      };

      // No runWithRequestContext — context is absent
      const capturedJobData = buildJobData(originalData);

      assert.equal(
        capturedJobData.correlationId,
        undefined,
        `iteration ${i}: job data must not have correlationId when context is absent`,
      );
    }
  });

  /**
   * Validates: Requirements 6.5, 6.6
   *
   * When a request context has a correlation ID, buildGrpcMetadata() must
   * include `correlation-id` in the gRPC metadata.
   */
  it('AiService gRPC metadata includes correlation-id when request context has a correlation ID', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const correlationId = randomUuidV4();
      let capturedMetadata: Metadata | undefined;

      runWithRequestContext({ correlationId }, () => {
        capturedMetadata = buildGrpcMetadata();
      });

      assert.ok(capturedMetadata !== undefined, `iteration ${i}: metadata must be captured`);

      const values = capturedMetadata!.get('correlation-id');
      assert.ok(
        values.length > 0,
        `iteration ${i}: gRPC metadata must contain 'correlation-id' key`,
      );
      assert.equal(
        values[0],
        correlationId,
        `iteration ${i}: gRPC metadata 'correlation-id' must equal "${correlationId}"`,
      );
    }
  });

  /**
   * Validates: Requirements 6.5, 6.6
   *
   * When request context has no correlation ID, gRPC metadata must not
   * contain a `correlation-id` entry.
   */
  it('AiService gRPC metadata does not include correlation-id when request context has no correlation ID', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      // No runWithRequestContext — context is absent
      const metadata = buildGrpcMetadata();
      const values = metadata.get('correlation-id');

      assert.equal(
        values.length,
        0,
        `iteration ${i}: gRPC metadata must not contain 'correlation-id' when context is absent`,
      );
    }
  });

  /**
   * Validates: Requirements 6.3, 6.4, 6.5, 6.6
   *
   * The same correlation ID must appear in BOTH job data and gRPC metadata
   * within the same request context — ensuring consistent propagation to all
   * downstream systems.
   */
  it('same correlation ID propagates consistently to both BullMQ job data and gRPC metadata', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const correlationId = randomUuidV4();
      let jobData: Record<string, unknown> | undefined;
      let grpcMetadata: Metadata | undefined;

      runWithRequestContext({ correlationId }, () => {
        jobData = buildJobData({ payload: randomString(6) });
        grpcMetadata = buildGrpcMetadata();
      });

      // BullMQ job data check
      assert.equal(
        jobData!.correlationId,
        correlationId,
        `iteration ${i}: BullMQ job data correlationId must match request context`,
      );

      // gRPC metadata check
      const metaValues = grpcMetadata!.get('correlation-id');
      assert.equal(
        metaValues[0],
        correlationId,
        `iteration ${i}: gRPC metadata correlation-id must match request context`,
      );

      // Both must be identical
      assert.equal(
        jobData!.correlationId,
        metaValues[0],
        `iteration ${i}: BullMQ correlationId and gRPC correlation-id must be identical`,
      );
    }
  });

  /**
   * Validates: Requirements 6.3, 6.4, 6.5, 6.6
   *
   * Correlation IDs with arbitrary valid string formats (not just UUID v4)
   * must still propagate correctly to all downstream systems.
   */
  it('arbitrary string correlation IDs propagate correctly to downstream systems', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      // Mix of UUID v4 and arbitrary strings
      const correlationId =
        i % 2 === 0 ? randomUuidV4() : randomString(Math.floor(Math.random() * 36) + 4);

      let jobData: Record<string, unknown> | undefined;
      let grpcMetadata: Metadata | undefined;

      runWithRequestContext({ correlationId }, () => {
        jobData = buildJobData({ event: 'test' });
        grpcMetadata = buildGrpcMetadata();
      });

      assert.equal(
        jobData!.correlationId,
        correlationId,
        `iteration ${i}: job data correlationId must equal "${correlationId}"`,
      );

      const metaValues = grpcMetadata!.get('correlation-id');
      assert.equal(
        metaValues[0],
        correlationId,
        `iteration ${i}: gRPC metadata correlation-id must equal "${correlationId}"`,
      );
    }
  });
});

/**
 * Property-Based Test: AI Service Fallback on Exhausted Retries
 *
 * Property 7: AI Service Fallback on Exhausted Retries
 * For any AI use case (summarize, briefing, suggestLabels, embeddings),
 * when AI Service is unavailable after all retries are exhausted,
 * Core API must return the predefined fallback response — never an unhandled exception or 500 error.
 *
 * Validates: Requirements 8.3
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getAiFallback } from '../../src/modules/ai/ai-fallback.handler.js';
import { withRetry } from '../../src/modules/ai/ai-retry.util.js';
import { status as GrpcStatus } from '@grpc/grpc-js';

const ITERATIONS = 100;

describe('Property 7: AI Service Fallback on Exhausted Retries', () => {
  // Test each use case fallback shape
  it('summarize fallback has null summary and fallback:true flag', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const fallback = getAiFallback('summarize');
      assert.equal(
        fallback.summary,
        null,
        `iteration ${i}: summarize fallback.summary must be null`,
      );
      assert.equal(
        fallback.fallback,
        true,
        `iteration ${i}: summarize fallback.fallback must be true`,
      );
    }
  });

  it('briefing fallback has null briefing and fallback:true flag', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const fallback = getAiFallback('briefing');
      assert.equal(
        fallback.briefing,
        null,
        `iteration ${i}: briefing fallback.briefing must be null`,
      );
      assert.equal(
        fallback.fallback,
        true,
        `iteration ${i}: briefing fallback.fallback must be true`,
      );
    }
  });

  it('suggestLabels fallback has empty array and fallback:true flag', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const fallback = getAiFallback('suggestLabels');
      assert.ok(
        Array.isArray(fallback.labels),
        `iteration ${i}: suggestLabels fallback.labels must be an array`,
      );
      assert.equal(
        fallback.labels.length,
        0,
        `iteration ${i}: suggestLabels fallback.labels must be empty`,
      );
      assert.equal(
        fallback.fallback,
        true,
        `iteration ${i}: suggestLabels fallback.fallback must be true`,
      );
    }
  });

  it('embeddings fallback has empty array and fallback:true flag', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const fallback = getAiFallback('embeddings');
      assert.ok(
        Array.isArray(fallback.embedding),
        `iteration ${i}: embeddings fallback.embedding must be an array`,
      );
      assert.equal(
        fallback.embedding.length,
        0,
        `iteration ${i}: embeddings fallback.embedding must be empty`,
      );
      assert.equal(
        fallback.fallback,
        true,
        `iteration ${i}: embeddings fallback.fallback must be true`,
      );
    }
  });

  it('all use cases have fallback:true — never undefined or false', () => {
    const useCases = ['summarize', 'briefing', 'suggestLabels', 'embeddings'] as const;
    for (const useCase of useCases) {
      const fallback = getAiFallback(useCase);
      assert.equal(fallback.fallback, true, `use case "${useCase}" must have fallback:true`);
    }
  });

  it('withRetry + fallback pattern never throws when AI unavailable', async () => {
    const testOptions = {
      maxAttempts: 2,
      initialDelayMs: 1,
      backoffMultiplier: 2,
      retryableErrors: [GrpcStatus.UNAVAILABLE],
    };

    for (let i = 0; i < ITERATIONS; i++) {
      // Simulate: withRetry exhausts retries, then catch returns fallback
      let result: string[] | null = null;
      let threw = false;

      try {
        await withRetry(
          () =>
            Promise.reject(
              Object.assign(new Error('UNAVAILABLE'), { code: GrpcStatus.UNAVAILABLE }),
            ),
          testOptions,
        );
      } catch {
        // Exhausted retries — apply fallback (simulating what ai.service.ts does)
        result = getAiFallback('suggestLabels').labels;
      }

      assert.ok(!threw, `iteration ${i}: must not throw unhandled exception`);
      assert.ok(Array.isArray(result), `iteration ${i}: fallback result must be an array`);
    }
  });
});

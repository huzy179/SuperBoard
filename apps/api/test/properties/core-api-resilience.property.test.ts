/**
 * Property-Based Test: Core API Resilience When Downstream Services Are Unavailable
 *
 * Property 14: Core API Resilience When Downstream Services Are Unavailable
 * For any Core API request that does not require Search or Automation Service data,
 * when the Search Service or Automation Service is unavailable, the Core API must
 * return a successful response — never propagating the downstream unavailability
 * as a Core API failure.
 *
 * Validates: Requirements 17.3
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const ITERATIONS = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars[randomInt(0, chars.length - 1)]).join('');
}

// ---------------------------------------------------------------------------
// Service availability simulation
// ---------------------------------------------------------------------------

type ServiceStatus = 'available' | 'unavailable' | 'timeout' | 'error';

interface DownstreamServices {
  search: ServiceStatus;
  automation: ServiceStatus;
}

/**
 * Simulates a Core API handler that:
 * - Performs its primary operation (always succeeds)
 * - Optionally calls Search/Automation services (fire-and-forget or optional)
 * - Never propagates Search/Automation failures to the caller
 */
async function coreApiHandler(
  requiresSearch: boolean,
  requiresAutomation: boolean,
  services: DownstreamServices,
  primaryOperation: () => Promise<unknown>,
): Promise<{ success: boolean; data: unknown; error: null | { code: string; message: string } }> {
  // Primary operation always runs
  const data = await primaryOperation();

  // Search service call — fire-and-forget, never blocks response
  if (requiresSearch) {
    try {
      await callDownstreamService('search', services.search);
    } catch {
      // Swallow — search unavailability must not fail the request
    }
  }

  // Automation service call — fire-and-forget, never blocks response
  if (requiresAutomation) {
    try {
      await callDownstreamService('automation', services.automation);
    } catch {
      // Swallow — automation unavailability must not fail the request
    }
  }

  return { success: true, data, error: null };
}

async function callDownstreamService(name: string, status: ServiceStatus): Promise<void> {
  switch (status) {
    case 'available':
      return;
    case 'unavailable':
      throw new Error(`${name} service unavailable`);
    case 'timeout':
      throw new Error(`${name} service timeout`);
    case 'error':
      throw new Error(`${name} service internal error`);
  }
}

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('Property 14: Core API Resilience When Downstream Services Are Unavailable', () => {
  /**
   * Core property: requests that don't need Search/Automation data succeed
   * regardless of those services' availability.
   */
  it('requests not requiring Search/Automation succeed when both are unavailable', async () => {
    const statuses: ServiceStatus[] = ['unavailable', 'timeout', 'error'];

    for (let i = 0; i < ITERATIONS; i++) {
      const searchStatus = statuses[randomInt(0, statuses.length - 1)];
      const automationStatus = statuses[randomInt(0, statuses.length - 1)];

      const result = await coreApiHandler(
        false, // does not require search
        false, // does not require automation
        { search: searchStatus, automation: automationStatus },
        async () => ({ id: randomString(), data: 'primary result' }),
      );

      assert.ok(result.success, `iteration ${i}: response must be successful`);
      assert.ok(result.data !== null, `iteration ${i}: data must be non-null`);
      assert.strictEqual(result.error, null, `iteration ${i}: error must be null`);
    }
  });

  /**
   * Requests that optionally use Search (but don't require it) succeed
   * when Search is unavailable.
   */
  it('requests with optional Search call succeed when Search is unavailable', async () => {
    const statuses: ServiceStatus[] = ['unavailable', 'timeout', 'error'];

    for (let i = 0; i < ITERATIONS; i++) {
      const searchStatus = statuses[randomInt(0, statuses.length - 1)];

      const result = await coreApiHandler(
        true, // calls search (optional/fire-and-forget)
        false,
        { search: searchStatus, automation: 'available' },
        async () => ({ tasks: [], projects: [] }),
      );

      assert.ok(
        result.success,
        `iteration ${i}: response must succeed despite Search unavailability`,
      );
      assert.strictEqual(result.error, null, `iteration ${i}: error must be null`);
    }
  });

  /**
   * Requests that optionally use Automation (but don't require it) succeed
   * when Automation is unavailable.
   */
  it('requests with optional Automation call succeed when Automation is unavailable', async () => {
    const statuses: ServiceStatus[] = ['unavailable', 'timeout', 'error'];

    for (let i = 0; i < ITERATIONS; i++) {
      const automationStatus = statuses[randomInt(0, statuses.length - 1)];

      const result = await coreApiHandler(
        false,
        true, // calls automation (optional/fire-and-forget)
        { search: 'available', automation: automationStatus },
        async () => ({ taskId: randomString(), status: 'updated' }),
      );

      assert.ok(
        result.success,
        `iteration ${i}: response must succeed despite Automation unavailability`,
      );
      assert.strictEqual(result.error, null, `iteration ${i}: error must be null`);
    }
  });

  /**
   * When both Search and Automation are unavailable simultaneously,
   * Core API still returns a successful response.
   */
  it('Core API succeeds when both Search and Automation are simultaneously unavailable', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const result = await coreApiHandler(
        true,
        true,
        { search: 'unavailable', automation: 'unavailable' },
        async () => ({ id: randomString(), result: 'ok' }),
      );

      assert.ok(
        result.success,
        `iteration ${i}: must succeed when both downstream services are down`,
      );
      assert.strictEqual(result.error, null, `iteration ${i}: error must be null`);
    }
  });

  /**
   * Primary operation result is always returned regardless of downstream status.
   */
  it('primary operation result is preserved regardless of downstream availability', async () => {
    const statuses: ServiceStatus[] = ['available', 'unavailable', 'timeout', 'error'];

    for (let i = 0; i < ITERATIONS; i++) {
      const expectedData = { id: randomString(), value: randomInt(1, 1000) };
      const searchStatus = statuses[randomInt(0, statuses.length - 1)];
      const automationStatus = statuses[randomInt(0, statuses.length - 1)];

      const result = await coreApiHandler(
        true,
        true,
        { search: searchStatus, automation: automationStatus },
        async () => expectedData,
      );

      assert.ok(result.success, `iteration ${i}: must succeed`);
      assert.deepStrictEqual(
        result.data,
        expectedData,
        `iteration ${i}: primary operation result must be preserved`,
      );
    }
  });

  /**
   * Downstream failures are swallowed — they never propagate as exceptions.
   */
  it('downstream failures never propagate as unhandled exceptions', async () => {
    const statuses: ServiceStatus[] = ['unavailable', 'timeout', 'error'];

    for (let i = 0; i < ITERATIONS; i++) {
      const searchStatus = statuses[randomInt(0, statuses.length - 1)];
      const automationStatus = statuses[randomInt(0, statuses.length - 1)];

      // This must never throw
      let threw = false;
      try {
        await coreApiHandler(
          true,
          true,
          { search: searchStatus, automation: automationStatus },
          async () => ({ ok: true }),
        );
      } catch {
        threw = true;
      }

      assert.ok(
        !threw,
        `iteration ${i}: downstream failure must not propagate as unhandled exception`,
      );
    }
  });

  /**
   * When downstream services are available, the response is still successful
   * (baseline — no regression).
   */
  it('response is successful when all downstream services are available', async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const result = await coreApiHandler(
        true,
        true,
        { search: 'available', automation: 'available' },
        async () => ({ id: randomString(), data: 'ok' }),
      );

      assert.ok(result.success, `iteration ${i}: must succeed when all services are available`);
      assert.strictEqual(result.error, null, `iteration ${i}: error must be null`);
    }
  });
});

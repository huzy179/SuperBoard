/**
 * Common test helpers and utilities (placeholder)
 * Full implementation will be done when Jest is properly configured
 */

import { EventEmitter } from 'events';

/**
 * Creates a promise that resolves after the specified delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits for an event to be emitted on an EventEmitter
 */
export function waitForEvent<T = unknown>(
  emitter: EventEmitter,
  eventName: string,
  timeout: number = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      emitter.removeListener(eventName, onEvent);
      reject(new Error(`Timeout waiting for event: ${eventName}`));
    }, timeout);

    const onEvent = (data: T) => {
      clearTimeout(timer);
      resolve(data);
    };

    emitter.once(eventName, onEvent);
  });
}

/**
 * Creates a test correlation ID
 */
export function createTestCorrelationId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a test timestamp
 */
export function createTestTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Creates a test environment configuration
 */
export function createTestEnvironment(): Record<string, string> {
  return {
    NODE_ENV: 'test',
    PORT: '3000',
    LOG_LEVEL: 'error',
    RABBITMQ_URL: 'amqp://test:test@localhost:5672',
    REDIS_URL: 'redis://localhost:6379',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
  };
}

/**
 * Cleanup helper for tests that create resources
 */
export class TestCleanup {
  private cleanupFunctions: Array<() => Promise<void> | void> = [];

  add(cleanupFn: () => Promise<void> | void): void {
    this.cleanupFunctions.push(cleanupFn);
  }

  async cleanup(): Promise<void> {
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      try {
        await cleanupFn();
      } catch (error) {
        console.error('Error during test cleanup:', error);
      }
    }
    this.cleanupFunctions = [];
  }
}

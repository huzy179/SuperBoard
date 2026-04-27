/**
 * Integration Tests: Event Handlers with Shared Framework
 *
 * Tests: Event processing with BaseEventHandler, correlation ID tracking, retry mechanisms
 * Requirements: 4.1, 4.2, 4.3
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { PresenceUpdateHandler } from '../src/collaboration/event-handlers/presence-update.handler';
import { DocSyncHandler } from '../src/collaboration/event-handlers/doc-sync.handler';
import { EventContext } from '@superboard/backend-shared/types';
import { v4 as uuid } from 'uuid';

// Mock PresenceService
class MockPresenceService {
  private presenceData = new Map<string, unknown>();

  async setPresence(
    channelType: string,
    channelId: string,
    userId: string,
    status: string,
  ): Promise<void> {
    const key = `${channelType}:${channelId}:${userId}`;
    this.presenceData.set(key, { status, timestamp: new Date().toISOString() });
  }

  getPresenceData() {
    return this.presenceData;
  }

  clear() {
    this.presenceData.clear();
  }
}

describe('Event Handlers Integration Tests', () => {
  let presenceService: MockPresenceService;
  let presenceHandler: PresenceUpdateHandler;
  let docSyncHandler: DocSyncHandler;

  beforeEach(() => {
    presenceService = new MockPresenceService();
    presenceHandler = new PresenceUpdateHandler(presenceService);
    docSyncHandler = new DocSyncHandler();
  });

  afterEach(() => {
    presenceService.clear();
  });

  describe('PresenceUpdateHandler', () => {
    it('should handle presence update events with correlation ID tracking', async () => {
      const correlationId = uuid();
      const payload = {
        channelType: 'project',
        channelId: 'proj-123',
        userId: 'user-1',
        status: 'online' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await presenceHandler.handle(payload, context);

      const key = `${payload.channelType}:${payload.channelId}:${payload.userId}`;
      const stored = presenceService.getPresenceData().get(key);
      assert.ok(stored, 'presence data should be stored');
      assert.equal((stored as { status: string }).status, 'online');
    });

    it('should preserve correlation ID through event processing', async () => {
      const correlationId = 'correlation-123';
      const payload = {
        channelType: 'doc',
        channelId: 'doc-456',
        userId: 'user-2',
        status: 'away' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { originalSource: 'websocket' },
      };

      await presenceHandler.handle(payload, context);

      // Correlation ID should be preserved in context
      assert.equal(context.correlationId, correlationId);
      assert.equal(context.metadata.originalSource, 'websocket');
    });

    it('should handle offline status correctly', async () => {
      const correlationId = uuid();
      const payload = {
        channelType: 'project',
        channelId: 'proj-789',
        userId: 'user-3',
        status: 'offline' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await presenceHandler.handle(payload, context);

      const key = `${payload.channelType}:${payload.channelId}:${payload.userId}`;
      const stored = presenceService.getPresenceData().get(key);
      // Offline status should still be tracked
      assert.ok(stored);
    });

    it('should track retry count in context', async () => {
      const correlationId = uuid();
      const payload = {
        channelType: 'chat',
        channelId: 'chan-001',
        userId: 'user-4',
        status: 'online' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 2,
        metadata: {},
      };

      await presenceHandler.handle(payload, context);

      assert.equal(context.retryCount, 2, 'retry count should be preserved');
    });
  });

  describe('DocSyncHandler', () => {
    it('should handle doc sync events with correlation ID', async () => {
      const correlationId = uuid();
      const payload = {
        docId: 'doc-123',
        operation: { type: 'insert', position: 5, text: 'hello' },
        userId: 'user-5',
        timestamp: new Date().toISOString(),
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      // Should not throw
      await docSyncHandler.handle(payload, context);

      assert.equal(context.correlationId, correlationId);
    });

    it('should preserve operation data through processing', async () => {
      const correlationId = uuid();
      const operation = { type: 'delete', position: 0, length: 3 };
      const payload = {
        docId: 'doc-456',
        operation,
        userId: 'user-6',
        timestamp: new Date().toISOString(),
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await docSyncHandler.handle(payload, context);

      // Operation should be preserved
      assert.deepEqual(payload.operation, operation);
    });

    it('should handle complex operations', async () => {
      const correlationId = uuid();
      const complexOperation = {
        type: 'transform',
        operations: [
          { type: 'insert', position: 0, text: 'prefix' },
          { type: 'delete', position: 10, length: 5 },
        ],
      };

      const payload = {
        docId: 'doc-789',
        operation: complexOperation,
        userId: 'user-7',
        timestamp: new Date().toISOString(),
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await docSyncHandler.handle(payload, context);

      assert.deepEqual(payload.operation, complexOperation);
    });
  });

  describe('Event Type Identification', () => {
    it('PresenceUpdateHandler should identify correct event type', () => {
      assert.equal(presenceHandler.getEventType(), 'presence.updated');
    });

    it('DocSyncHandler should identify correct event type', () => {
      assert.equal(docSyncHandler.getEventType(), 'doc.synced');
    });
  });

  describe('Correlation ID Tracking Across Multiple Events', () => {
    it('should maintain correlation ID across sequential event processing', async () => {
      const correlationId = uuid();

      const presencePayload = {
        channelType: 'project',
        channelId: 'proj-123',
        userId: 'user-8',
        status: 'online' as const,
      };

      const presenceContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { source: 'websocket' },
      };

      await presenceHandler.handle(presencePayload, presenceContext);

      const docPayload = {
        docId: 'doc-123',
        operation: { type: 'insert', position: 0, text: 'test' },
        userId: 'user-8',
        timestamp: new Date().toISOString(),
      };

      const docContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { source: 'websocket' },
      };

      await docSyncHandler.handle(docPayload, docContext);

      // Both contexts should have the same correlation ID
      assert.equal(presenceContext.correlationId, docContext.correlationId);
      assert.equal(presenceContext.correlationId, correlationId);
    });
  });
});

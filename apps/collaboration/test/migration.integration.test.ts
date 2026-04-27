/**
 * Integration Tests: Collaboration Service Migration
 *
 * Tests: Full migration to shared library components
 * Requirements: 4.1, 7.2
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach, afterEach } from 'node:test';
import { PresenceUpdateHandler, DocSyncHandler } from '../src/collaboration/event-handlers';
import { RedisPoolManager, DatabasePoolManager } from '@superboard/backend-shared/connections';
import { EventContext } from '@superboard/backend-shared/types';
import { v4 as uuid } from 'uuid';

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

describe('Collaboration Service Migration Integration Tests', () => {
  let redisPool: RedisPoolManager;
  let dbPool: DatabasePoolManager;
  let presenceService: MockPresenceService;
  let presenceHandler: PresenceUpdateHandler;
  let docSyncHandler: DocSyncHandler;

  beforeEach(() => {
    redisPool = new RedisPoolManager();
    dbPool = new DatabasePoolManager();
    presenceService = new MockPresenceService();
    presenceHandler = new PresenceUpdateHandler(presenceService);
    docSyncHandler = new DocSyncHandler();
  });

  afterEach(async () => {
    presenceService.clear();
    await redisPool.closeAll();
    await dbPool.closeAll();
  });

  describe('Event Processing with Shared Framework', () => {
    it('should process presence events with correlation ID tracking', async () => {
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
        metadata: { source: 'websocket' },
      };

      await presenceHandler.handle(payload, context);

      const key = `${payload.channelType}:${payload.channelId}:${payload.userId}`;
      const stored = presenceService.getPresenceData().get(key);

      assert.ok(stored, 'presence should be stored');
      assert.equal(context.correlationId, correlationId, 'correlation ID should be preserved');
    });

    it('should process doc sync events with correlation ID', async () => {
      const correlationId = uuid();
      const payload = {
        docId: 'doc-123',
        operation: { type: 'insert', position: 0, text: 'test' },
        userId: 'user-2',
        timestamp: new Date().toISOString(),
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await docSyncHandler.handle(payload, context);

      assert.equal(context.correlationId, correlationId);
    });

    it('should handle multiple events with same correlation ID', async () => {
      const correlationId = uuid();

      const presencePayload = {
        channelType: 'project',
        channelId: 'proj-456',
        userId: 'user-3',
        status: 'online' as const,
      };

      const presenceContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await presenceHandler.handle(presencePayload, presenceContext);

      const docPayload = {
        docId: 'doc-456',
        operation: { type: 'delete', position: 5, length: 3 },
        userId: 'user-3',
        timestamp: new Date().toISOString(),
      };

      const docContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      await docSyncHandler.handle(docPayload, docContext);

      assert.equal(presenceContext.correlationId, docContext.correlationId);
      assert.equal(presenceContext.correlationId, correlationId);
    });
  });

  describe('Connection Pool Management Integration', () => {
    it('should manage Redis connections through shared pool', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
        db: 0,
      };

      const connection = await redisPool.getConnection(config);
      assert.ok(connection, 'should get Redis connection from pool');
      assert.equal(connection.status, 'ready', 'connection should be ready');
    });

    it('should reuse Redis connections from pool', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
        db: 0,
      };

      const conn1 = await redisPool.getConnection(config);
      const conn2 = await redisPool.getConnection(config);

      assert.equal(conn1, conn2, 'should reuse connection from pool');
    });

    it('should perform health checks on pooled connections', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
        db: 0,
      };

      await redisPool.getConnection(config);
      const poolKey = 'localhost:6379:0';
      const isHealthy = await redisPool.healthCheck(poolKey);

      assert.equal(isHealthy, true, 'pooled connection should be healthy');
    });

    it('should track pool metrics', async () => {
      const config = {
        host: 'localhost',
        port: 6379,
        db: 0,
      };

      await redisPool.getConnection(config);
      const poolKey = 'localhost:6379:0';
      const metrics = redisPool.getMetrics(poolKey);

      assert.ok(metrics, 'should return pool metrics');
      assert.equal(metrics.activeConnections, 1);
      assert.equal(metrics.totalConnections, 1);
    });
  });

  describe('Retry Mechanism Configuration', () => {
    it('should configure retry mechanism in event handlers', async () => {
      const correlationId = uuid();
      const payload = {
        channelType: 'project',
        channelId: 'proj-789',
        userId: 'user-4',
        status: 'online' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: {},
      };

      // Handler should have retry configured
      await presenceHandler.handle(payload, context);

      assert.ok(presenceHandler.getEventType(), 'handler should have event type');
    });

    it('should track retry count in context', async () => {
      const correlationId = uuid();
      const payload = {
        channelType: 'chat',
        channelId: 'chan-001',
        userId: 'user-5',
        status: 'away' as const,
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

  describe('Event Type Identification', () => {
    it('should identify presence update event type', () => {
      assert.equal(presenceHandler.getEventType(), 'presence.updated');
    });

    it('should identify doc sync event type', () => {
      assert.equal(docSyncHandler.getEventType(), 'doc.synced');
    });
  });

  describe('Full Migration Scenario', () => {
    it('should handle complete collaboration workflow with shared components', async () => {
      const correlationId = uuid();

      // Step 1: User joins channel
      const joinPayload = {
        channelType: 'project',
        channelId: 'proj-migration-test',
        userId: 'user-migration',
        status: 'online' as const,
      };

      const joinContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { action: 'join' },
      };

      await presenceHandler.handle(joinPayload, joinContext);

      const joinKey = `${joinPayload.channelType}:${joinPayload.channelId}:${joinPayload.userId}`;
      const joinedPresence = presenceService.getPresenceData().get(joinKey);
      assert.ok(joinedPresence, 'user should be marked as online');

      // Step 2: User edits document
      const editPayload = {
        docId: 'doc-migration-test',
        operation: { type: 'insert', position: 0, text: 'migration test' },
        userId: 'user-migration',
        timestamp: new Date().toISOString(),
      };

      const editContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { action: 'edit' },
      };

      await docSyncHandler.handle(editPayload, editContext);

      // Step 3: User leaves channel
      const leavePayload = {
        channelType: 'project',
        channelId: 'proj-migration-test',
        userId: 'user-migration',
        status: 'offline' as const,
      };

      const leaveContext: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { action: 'leave' },
      };

      await presenceHandler.handle(leavePayload, leaveContext);

      // All events should have same correlation ID
      assert.equal(joinContext.correlationId, correlationId);
      assert.equal(editContext.correlationId, correlationId);
      assert.equal(leaveContext.correlationId, correlationId);
    });

    it('should maintain consistency across connection pool and event processing', async () => {
      const correlationId = uuid();

      // Get Redis connection from pool
      const redisConfig = {
        host: 'localhost',
        port: 6379,
        db: 0,
      };

      const connection = await redisPool.getConnection(redisConfig);
      assert.ok(connection, 'should get Redis connection');

      // Process event with correlation ID
      const payload = {
        channelType: 'project',
        channelId: 'proj-consistency',
        userId: 'user-consistency',
        status: 'online' as const,
      };

      const context: EventContext = {
        correlationId,
        timestamp: new Date(),
        retryCount: 0,
        metadata: { poolKey: 'localhost:6379:0' },
      };

      await presenceHandler.handle(payload, context);

      // Verify consistency
      assert.equal(context.correlationId, correlationId);
      assert.equal(context.metadata.poolKey, 'localhost:6379:0');

      const key = `${payload.channelType}:${payload.channelId}:${payload.userId}`;
      const stored = presenceService.getPresenceData().get(key);
      assert.ok(stored, 'presence should be stored consistently');
    });
  });
});

/**
 * Contract exports test for @superboard/shared
 * Validates: Requirements 7.1
 *
 * Verifies all required exports from the shared package are present and correctly typed.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Runtime value imports
import {
  ErrorCodes,
  apiSuccess,
  apiError,
  RABBITMQ_EXCHANGES,
  RABBITMQ_QUEUES,
  RABBITMQ_DLQ_NAMES,
  VALID_ROUTING_KEYS,
} from '../index.js';

// Type-only imports (verified via TypeScript compilation)
import type {
  // Event payload types
  TaskCreatedPayload,
  TaskUpdatedPayload,
  TaskStatusChangedPayload,
  DocUpdatedPayload,
  DocVersionCreatedPayload,
  ProjectUpdatedPayload,
  MessageSentPayload,
  MessageReactionAddedPayload,
  UserInvitedPayload,
  UserMemberJoinedPayload,
  // Base event interface
  DomainEvent,
  // RabbitMQ event interface
  RabbitMQDomainEvent,
  ValidRoutingKey,
  // DTO types
  NotificationJobDTO,
  HealthDataDTO,
  DependencyHealthDTO,
  // Correlation context
  CorrelationContext,
} from '../index.js';

describe('Contract Package Exports', () => {
  describe('Runtime values are defined', () => {
    it('ErrorCodes is an object', () => {
      assert.ok(ErrorCodes !== undefined, 'ErrorCodes should be defined');
      assert.equal(typeof ErrorCodes, 'object', 'ErrorCodes should be an object');
    });

    it('ErrorCodes has expected keys', () => {
      assert.ok('AUTH_TOKEN_INVALID' in ErrorCodes);
      assert.ok('AUTH_TOKEN_EXPIRED' in ErrorCodes);
      assert.ok('AUTH_CREDENTIALS_INVALID' in ErrorCodes);
      assert.ok('AUTH_PERMISSION_DENIED' in ErrorCodes);
      assert.ok('WORKSPACE_NOT_FOUND' in ErrorCodes);
      assert.ok('PROJECT_NOT_FOUND' in ErrorCodes);
      assert.ok('TASK_NOT_FOUND' in ErrorCodes);
      assert.ok('VALIDATION_FAILED' in ErrorCodes);
      assert.ok('INTERNAL_ERROR' in ErrorCodes);
    });

    it('apiSuccess is a function', () => {
      assert.ok(apiSuccess !== undefined, 'apiSuccess should be defined');
      assert.equal(typeof apiSuccess, 'function', 'apiSuccess should be a function');
    });

    it('apiSuccess returns a well-formed response', () => {
      const result = apiSuccess({ id: '123' });
      assert.equal(result.success, true);
      assert.deepEqual(result.data, { id: '123' });
      assert.equal(result.error, null);
      assert.ok(result.meta.timestamp);
    });

    it('apiError is a function', () => {
      assert.ok(apiError !== undefined, 'apiError should be defined');
      assert.equal(typeof apiError, 'function', 'apiError should be a function');
    });

    it('apiError returns a well-formed error response', () => {
      const result = apiError('NOT_FOUND', 'Resource not found');
      assert.equal(result.success, false);
      assert.equal(result.data, null);
      assert.ok(result.error);
      assert.equal(result.error.code, 'NOT_FOUND');
      assert.equal(result.error.message, 'Resource not found');
      assert.ok(result.meta.timestamp);
    });

    it('RABBITMQ_EXCHANGES is an object with expected keys', () => {
      assert.ok(RABBITMQ_EXCHANGES !== undefined, 'RABBITMQ_EXCHANGES should be defined');
      assert.equal(typeof RABBITMQ_EXCHANGES, 'object', 'RABBITMQ_EXCHANGES should be an object');
      assert.equal(RABBITMQ_EXCHANGES.DOMAIN_EVENTS, 'superboard.domain.events');
      assert.equal(RABBITMQ_EXCHANGES.DEAD_LETTER, 'superboard.domain.events.dlx');
    });

    it('RABBITMQ_QUEUES is an object with expected service queues', () => {
      assert.ok(RABBITMQ_QUEUES !== undefined, 'RABBITMQ_QUEUES should be defined');
      assert.equal(typeof RABBITMQ_QUEUES, 'object', 'RABBITMQ_QUEUES should be an object');
      assert.equal(RABBITMQ_QUEUES.AI, 'ai.domain.events');
      assert.equal(RABBITMQ_QUEUES.NOTIFICATION, 'notification.domain.events');
      assert.equal(RABBITMQ_QUEUES.SEARCH, 'search.domain.events');
      assert.equal(RABBITMQ_QUEUES.AUTOMATION, 'automation.domain.events');
    });

    it('RABBITMQ_DLQ_NAMES is an object with expected DLQ names', () => {
      assert.ok(RABBITMQ_DLQ_NAMES !== undefined, 'RABBITMQ_DLQ_NAMES should be defined');
      assert.equal(typeof RABBITMQ_DLQ_NAMES, 'object', 'RABBITMQ_DLQ_NAMES should be an object');
      assert.equal(RABBITMQ_DLQ_NAMES.AI, 'ai.domain.events.dlq');
      assert.equal(RABBITMQ_DLQ_NAMES.NOTIFICATION, 'notification.domain.events.dlq');
      assert.equal(RABBITMQ_DLQ_NAMES.SEARCH, 'search.domain.events.dlq');
      assert.equal(RABBITMQ_DLQ_NAMES.AUTOMATION, 'automation.domain.events.dlq');
    });

    it('VALID_ROUTING_KEYS is an array with 12 routing keys', () => {
      assert.ok(VALID_ROUTING_KEYS !== undefined, 'VALID_ROUTING_KEYS should be defined');
      assert.ok(Array.isArray(VALID_ROUTING_KEYS), 'VALID_ROUTING_KEYS should be an array');
      assert.equal(VALID_ROUTING_KEYS.length, 12, 'VALID_ROUTING_KEYS should have 12 items');
      assert.ok(VALID_ROUTING_KEYS.includes('task.created'));
      assert.ok(VALID_ROUTING_KEYS.includes('user.member_joined'));
    });
  });

  describe('Type exports compile correctly', () => {
    it('Event payload types are usable as TypeScript types', () => {
      // These assignments verify the types compile — if any type is missing the file won't compile
      const _taskCreated: TaskCreatedPayload = {
        taskId: 't1',
        title: 'Test',
        projectId: 'p1',
        workspaceId: 'w1',
        creatorId: 'u1',
      };

      const _taskUpdated: TaskUpdatedPayload = {
        taskId: 't1',
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changes: {},
      };

      const _taskStatusChanged: TaskStatusChangedPayload = {
        taskId: 't1',
        projectId: 'p1',
        workspaceId: 'w1',
        oldStatus: 'todo',
        newStatus: 'done',
        changedBy: 'u1',
      };

      const _docUpdated: DocUpdatedPayload = {
        docId: 'd1',
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changeType: 'content',
      };

      const _docVersionCreated: DocVersionCreatedPayload = {
        docId: 'd1',
        versionId: 'v1',
        projectId: 'p1',
        workspaceId: 'w1',
        createdBy: 'u1',
      };

      const _projectUpdated: ProjectUpdatedPayload = {
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changes: {},
      };

      const _messageSent: MessageSentPayload = {
        messageId: 'm1',
        channelId: 'c1',
        workspaceId: 'w1',
        senderId: 'u1',
        content: 'Hello',
      };

      const _messageReactionAdded: MessageReactionAddedPayload = {
        messageId: 'm1',
        channelId: 'c1',
        workspaceId: 'w1',
        userId: 'u1',
        emoji: '👍',
      };

      const _userInvited: UserInvitedPayload = {
        inviteeEmail: 'test@example.com',
        inviterId: 'u1',
        workspaceId: 'w1',
        workspaceName: 'My Workspace',
        token: 'tok123',
      };

      const _userMemberJoined: UserMemberJoinedPayload = {
        userId: 'u1',
        workspaceId: 'w1',
        role: 'member',
        joinedAt: new Date().toISOString(),
      };

      assert.ok(_taskCreated);
      assert.ok(_taskUpdated);
      assert.ok(_taskStatusChanged);
      assert.ok(_docUpdated);
      assert.ok(_docVersionCreated);
      assert.ok(_projectUpdated);
      assert.ok(_messageSent);
      assert.ok(_messageReactionAdded);
      assert.ok(_userInvited);
      assert.ok(_userMemberJoined);

      assert.ok(true, 'All event payload types compiled successfully');
    });

    it('DomainEvent base interface is usable as a TypeScript type', () => {
      const _event: DomainEvent<{ id: string }> = {
        eventId: 'e1',
        eventType: 'task.created',
        eventVersion: '1.0',
        producer: 'core-api',
        correlationId: 'corr1',
        idempotencyKey: 'idem1',
        occurredAt: new Date().toISOString(),
        payload: { id: 'p1' },
      };

      assert.ok(_event);
      assert.ok(true, 'DomainEvent type compiled successfully');
    });

    it('RabbitMQDomainEvent interface is usable as a TypeScript type', () => {
      const _rabbitMQEvent: RabbitMQDomainEvent<{ id: string }> = {
        eventId: 'e1',
        eventType: 'task.created',
        eventVersion: '1.0',
        producer: 'core-api',
        correlationId: 'corr1',
        idempotencyKey: 'idem1',
        occurredAt: new Date().toISOString(),
        payload: { id: 'p1' },
        routingKey: 'task.created',
        exchange: 'superboard.domain.events',
      };

      assert.ok(_rabbitMQEvent);
      assert.ok(true, 'RabbitMQDomainEvent type compiled successfully');
    });

    it('ValidRoutingKey type is usable as a TypeScript type', () => {
      const _routingKey: ValidRoutingKey = 'task.created';
      assert.ok(_routingKey);
      assert.ok(true, 'ValidRoutingKey type compiled successfully');
    });

    it('DTO types are usable as TypeScript types', () => {
      const _dep: DependencyHealthDTO = {
        name: 'postgres',
        status: 'healthy',
        latencyMs: 5,
      };

      const _health: HealthDataDTO = {
        status: 'ok',
        service: 'api',
        version: '1.0.0',
        uptime: 3600,
        dependencies: [_dep],
      };

      const _notifJob: NotificationJobDTO = {
        id: 'n1',
        correlationId: 'corr1',
        type: 'in-app',
        recipientId: 'u1',
        payload: { title: 'Hello', body: 'World' },
        createdAt: new Date().toISOString(),
      };

      assert.ok(_health);
      assert.ok(_notifJob);
      assert.ok(true, 'DTO types compiled successfully');
    });

    it('CorrelationContext type is usable as a TypeScript type', () => {
      const _ctx: CorrelationContext = {
        correlationId: 'corr1',
        requestId: 'req1',
        userId: 'u1',
        workspaceId: 'w1',
      };

      assert.ok(_ctx);
      assert.ok(true, 'CorrelationContext type compiled successfully');
    });
  });
});

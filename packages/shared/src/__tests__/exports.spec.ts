/**
 * Unit test xác nhận Contract Package exports đúng
 * Validates: Requirements 7.1
 *
 * Kiểm tra tất cả event payload types, DTO types, và base event interface được export
 * từ @superboard/shared package index.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Runtime value imports — xác nhận các giá trị runtime được export
import { ErrorCodes, apiSuccess, apiError } from '../index';

// Type-only imports — xác nhận TypeScript types được export (compile-time check)
import type {
  // Base event interface
  DomainEvent,
  // Task event payload types
  TaskCreatedPayload,
  TaskUpdatedPayload,
  TaskStatusChangedPayload,
  // Doc event payload types
  DocUpdatedPayload,
  DocVersionCreatedPayload,
  // Project event payload types
  ProjectUpdatedPayload,
  // Message event payload types
  MessageSentPayload,
  MessageReactionAddedPayload,
  // User event payload types
  UserInvitedPayload,
  UserMemberJoinedPayload,
  // DTO types
  NotificationJobDTO,
  HealthDataDTO,
  DependencyHealthDTO,
  // Correlation context type
  CorrelationContext,
} from '../index';

describe('Contract Package Exports — @superboard/shared', () => {
  describe('Runtime value exports', () => {
    it('ErrorCodes catalog được export và là object', () => {
      assert.ok(ErrorCodes !== undefined, 'ErrorCodes phải được export');
      assert.equal(typeof ErrorCodes, 'object', 'ErrorCodes phải là object');
    });

    it('ErrorCodes chứa đủ domain error codes', () => {
      // Auth domain
      assert.ok('AUTH_TOKEN_INVALID' in ErrorCodes, 'AUTH_TOKEN_INVALID phải tồn tại');
      assert.ok('AUTH_TOKEN_EXPIRED' in ErrorCodes, 'AUTH_TOKEN_EXPIRED phải tồn tại');
      assert.ok('AUTH_CREDENTIALS_INVALID' in ErrorCodes, 'AUTH_CREDENTIALS_INVALID phải tồn tại');
      assert.ok('AUTH_PERMISSION_DENIED' in ErrorCodes, 'AUTH_PERMISSION_DENIED phải tồn tại');
      // Workspace domain
      assert.ok('WORKSPACE_NOT_FOUND' in ErrorCodes, 'WORKSPACE_NOT_FOUND phải tồn tại');
      // Project domain
      assert.ok('PROJECT_NOT_FOUND' in ErrorCodes, 'PROJECT_NOT_FOUND phải tồn tại');
      // Task domain
      assert.ok('TASK_NOT_FOUND' in ErrorCodes, 'TASK_NOT_FOUND phải tồn tại');
      // Generic codes
      assert.ok('VALIDATION_FAILED' in ErrorCodes, 'VALIDATION_FAILED phải tồn tại');
      assert.ok('INTERNAL_ERROR' in ErrorCodes, 'INTERNAL_ERROR phải tồn tại');
      assert.ok('RATE_LIMIT_EXCEEDED' in ErrorCodes, 'RATE_LIMIT_EXCEEDED phải tồn tại');
    });

    it('apiSuccess được export và là function', () => {
      assert.ok(apiSuccess !== undefined, 'apiSuccess phải được export');
      assert.equal(typeof apiSuccess, 'function', 'apiSuccess phải là function');
    });

    it('apiError được export và là function', () => {
      assert.ok(apiError !== undefined, 'apiError phải được export');
      assert.equal(typeof apiError, 'function', 'apiError phải là function');
    });
  });

  describe('Event payload type exports (compile-time verification)', () => {
    it('DomainEvent base interface được export', () => {
      const event: DomainEvent<{ id: string }> = {
        eventId: 'ulid-001',
        eventType: 'task.created',
        eventVersion: '1.0',
        producer: 'core-api',
        correlationId: 'corr-001',
        idempotencyKey: 'idem-001',
        occurredAt: new Date().toISOString(),
        payload: { id: 'task-1' },
      };
      assert.ok(event.eventId, 'DomainEvent phải có eventId');
      assert.ok(event.eventType, 'DomainEvent phải có eventType');
      assert.ok(event.payload, 'DomainEvent phải có payload');
    });

    it('Task event payload types được export', () => {
      const created: TaskCreatedPayload = {
        taskId: 't1',
        title: 'Test Task',
        projectId: 'p1',
        workspaceId: 'w1',
        creatorId: 'u1',
      };
      const updated: TaskUpdatedPayload = {
        taskId: 't1',
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changes: { title: 'New Title' },
      };
      const statusChanged: TaskStatusChangedPayload = {
        taskId: 't1',
        projectId: 'p1',
        workspaceId: 'w1',
        oldStatus: 'todo',
        newStatus: 'in_progress',
        changedBy: 'u1',
      };
      assert.ok(created.taskId, 'TaskCreatedPayload phải có taskId');
      assert.ok(updated.changes, 'TaskUpdatedPayload phải có changes');
      assert.ok(statusChanged.newStatus, 'TaskStatusChangedPayload phải có newStatus');
    });

    it('Doc event payload types được export', () => {
      const docUpdated: DocUpdatedPayload = {
        docId: 'd1',
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changeType: 'content',
      };
      const versionCreated: DocVersionCreatedPayload = {
        docId: 'd1',
        versionId: 'v1',
        projectId: 'p1',
        workspaceId: 'w1',
        createdBy: 'u1',
      };
      assert.ok(docUpdated.docId, 'DocUpdatedPayload phải có docId');
      assert.ok(versionCreated.versionId, 'DocVersionCreatedPayload phải có versionId');
    });

    it('Project event payload types được export', () => {
      const projectUpdated: ProjectUpdatedPayload = {
        projectId: 'p1',
        workspaceId: 'w1',
        updatedBy: 'u1',
        changes: { name: 'New Name' },
      };
      assert.ok(projectUpdated.projectId, 'ProjectUpdatedPayload phải có projectId');
    });

    it('Message event payload types được export', () => {
      const messageSent: MessageSentPayload = {
        messageId: 'm1',
        channelId: 'c1',
        workspaceId: 'w1',
        senderId: 'u1',
        content: 'Hello',
      };
      const reactionAdded: MessageReactionAddedPayload = {
        messageId: 'm1',
        channelId: 'c1',
        workspaceId: 'w1',
        userId: 'u1',
        emoji: '👍',
      };
      assert.ok(messageSent.messageId, 'MessageSentPayload phải có messageId');
      assert.ok(reactionAdded.emoji, 'MessageReactionAddedPayload phải có emoji');
    });

    it('User event payload types được export', () => {
      const userInvited: UserInvitedPayload = {
        inviteeEmail: 'test@example.com',
        inviterId: 'u1',
        workspaceId: 'w1',
        workspaceName: 'My Workspace',
        token: 'tok123',
      };
      const memberJoined: UserMemberJoinedPayload = {
        userId: 'u1',
        workspaceId: 'w1',
        role: 'member',
        joinedAt: new Date().toISOString(),
      };
      assert.ok(userInvited.inviteeEmail, 'UserInvitedPayload phải có inviteeEmail');
      assert.ok(memberJoined.role, 'UserMemberJoinedPayload phải có role');
    });
  });

  describe('DTO type exports (compile-time verification)', () => {
    it('HealthDataDTO và DependencyHealthDTO được export', () => {
      const dep: DependencyHealthDTO = {
        name: 'postgres',
        status: 'healthy',
        latencyMs: 5,
      };
      const health: HealthDataDTO = {
        status: 'ok',
        service: 'core-api',
        version: '1.0.0',
        uptime: 3600,
        dependencies: [dep],
      };
      assert.ok(health.service, 'HealthDataDTO phải có service');
      assert.equal(health.dependencies.length, 1, 'HealthDataDTO phải có dependencies');
      assert.ok(dep.name, 'DependencyHealthDTO phải có name');
    });

    it('NotificationJobDTO được export', () => {
      const job: NotificationJobDTO = {
        id: 'ulid-notif-001',
        correlationId: 'corr-001',
        type: 'in-app',
        recipientId: 'u1',
        payload: { title: 'New Task', body: 'A task was assigned to you' },
        createdAt: new Date().toISOString(),
      };
      assert.ok(job.id, 'NotificationJobDTO phải có id');
      assert.ok(job.type, 'NotificationJobDTO phải có type');
      assert.ok(job.recipientId, 'NotificationJobDTO phải có recipientId');
    });
  });

  describe('CorrelationContext type export (compile-time verification)', () => {
    it('CorrelationContext được export', () => {
      const ctx: CorrelationContext = {
        correlationId: 'corr-001',
        requestId: 'req-001',
        userId: 'u1',
        workspaceId: 'w1',
      };
      assert.ok(ctx.correlationId, 'CorrelationContext phải có correlationId');
    });
  });
});

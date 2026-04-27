import { Injectable, Logger } from '@nestjs/common';
import { BaseEventHandler } from '@superboard/backend-shared/events';
import { EventContext } from '@superboard/backend-shared/types';

interface DocSyncPayload {
  docId: string;
  operation: unknown;
  userId: string;
  timestamp: string;
}

@Injectable()
export class DocSyncHandler extends BaseEventHandler<DocSyncPayload> {
  private readonly logger = new Logger(DocSyncHandler.name);

  constructor() {
    super({
      retry: {
        maxAttempts: 3,
        initialDelay: 250,
        maxDelay: 5000,
        backoffMultiplier: 2,
        retryableErrors: ['TimeoutError', 'ConnectionError'],
      },
    });
  }

  getEventType(): string {
    return 'doc.synced';
  }

  async handle(payload: DocSyncPayload, context: EventContext): Promise<void> {
    this.logger.debug(`Processing doc sync for doc ${payload.docId} by user ${payload.userId}`, {
      correlationId: context.correlationId,
      retryCount: context.retryCount,
    });

    // Document sync operations are typically broadcast via WebSocket
    // This handler ensures the operation is logged and tracked with correlation ID
    // Correlation ID is preserved throughout the processing pipeline
    this.logger.debug(`Doc sync completed for doc ${payload.docId}`, {
      correlationId: context.correlationId,
      timestamp: context.timestamp,
    });
  }
}

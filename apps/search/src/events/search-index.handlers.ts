import { Logger } from '@nestjs/common';
import { BaseEventHandler, EventBus } from '@superboard/backend-shared/events';
import type { EventContext } from '@superboard/backend-shared';
import type { MetricsService } from '@superboard/backend-shared/metrics';

export const SEARCH_EVENT_TYPES = new Set([
  'task.created',
  'task.updated',
  'task.status_changed',
  'doc.updated',
  'project.updated',
]);

export const SEARCH_BINDING_KEYS = ['task.*', 'doc.updated', 'project.updated'];

class SearchIndexEventHandler extends BaseEventHandler<Record<string, unknown>> {
  private readonly logger = new Logger(SearchIndexEventHandler.name);

  constructor(private readonly eventType: string) {
    super({
      retry: { maxAttempts: 3, initialDelay: 50, maxDelay: 1000, backoffMultiplier: 2 },
    });
  }

  getEventType(): string {
    return this.eventType;
  }

  async handle(payload: Record<string, unknown>, context: EventContext): Promise<void> {
    this.logger.log(
      `[search-index] update for '${this.eventType}' (correlationId=${context.correlationId})`,
    );

    switch (this.eventType) {
      case 'task.created':
      case 'task.updated':
      case 'task.status_changed':
        this.logger.log(
          `[search-index] [mock] index task taskId=${payload.taskId} projectId=${payload.projectId}`,
        );
        break;
      case 'doc.updated':
        this.logger.log(
          `[search-index] [mock] index doc docId=${payload.docId} projectId=${payload.projectId}`,
        );
        break;
      case 'project.updated':
        this.logger.log(`[search-index] [mock] index project projectId=${payload.projectId}`);
        break;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function createSearchEventBus(metricsService?: MetricsService): EventBus {
  const bus = new EventBus({ metricsService, serviceName: 'search' });
  for (const eventType of SEARCH_EVENT_TYPES) {
    bus.subscribe(eventType, new SearchIndexEventHandler(eventType));
  }
  return bus;
}

export interface CorrelationContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  workspaceId?: string;
}

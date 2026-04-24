export interface NotificationJobDTO {
  id: string; // Idempotency key (ULID)
  correlationId: string;
  type: 'in-app' | 'email' | 'digest' | 'reminder';
  recipientId: string;
  templateId?: string;
  payload: {
    title?: string;
    body?: string;
    actionUrl?: string;
    metadata?: Record<string, unknown>;
  };
  createdAt: string;
  scheduledAt?: string; // For digest/reminder
}

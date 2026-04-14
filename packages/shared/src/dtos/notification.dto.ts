import type { ApiResponse } from '../types/common.types';

export interface NotificationItemDTO {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
  neuralPriority?: 'high' | 'medium' | 'low' | 'STRATEGIC';
  aiSummary?: string;
}

export interface NotificationListDataDTO {
  notifications: NotificationItemDTO[];
  unreadCount: number;
}

export type NotificationListResponseDTO = ApiResponse<NotificationListDataDTO>;

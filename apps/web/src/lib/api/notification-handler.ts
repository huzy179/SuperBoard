/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';
import { getErrorMessage } from './error-map';

export type ActionType =
  | 'create'
  | 'update'
  | 'delete'
  | 'archive'
  | 'restore'
  | 'sync'
  | 'send'
  | 'upload';

const ACTION_LABELS: Record<ActionType, string> = {
  create: 'Tạo',
  update: 'Cập nhật',
  delete: 'Xóa',
  archive: 'Lưu trữ',
  restore: 'Khôi phục',
  sync: 'Đồng bộ',
  send: 'Gửi',
  upload: 'Tải lên',
};

const ACTION_PAST_TENSE: Record<ActionType, string> = {
  create: 'Đã tạo',
  update: 'Đã cập nhật',
  delete: 'Đã xóa',
  archive: 'Đã lưu trữ',
  restore: 'Đã khôi phục',
  sync: 'Đã đồng bộ',
  send: 'Đã gửi',
  upload: 'Đã tải lên',
};

export const notify = {
  /**
   * Show a success toast based on action and resource name.
   */
  success: (action: ActionType, resourceName: string, customMessage?: string) => {
    const message =
      customMessage || `${ACTION_PAST_TENSE[action]} ${resourceName.toLowerCase()} thành công.`;
    toast.success(message);
  },

  /**
   * Show an error toast with localized message.
   */
  error: (error: unknown, action?: ActionType, resourceName?: string) => {
    const errorObj = error as { code?: string; message?: string } | null;
    const code = errorObj?.code || (error instanceof Error ? (error as any).code : undefined);
    const apiMessage = errorObj?.message || (error instanceof Error ? error.message : undefined);

    // Use mapped message or fallback to api message or generic failure
    const localizedMessage = getErrorMessage(code, apiMessage);

    const prefix =
      action && resourceName
        ? `Không thể ${ACTION_LABELS[action].toLowerCase()} ${resourceName.toLowerCase()}: `
        : '';

    toast.error(`${prefix}${localizedMessage}`);
  },
};

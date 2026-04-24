/**
 * Maps backend error codes to user-friendly Vietnamese messages.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Global & Auth
  INTERNAL_SERVER_ERROR: 'Lỗi hệ thống. Vui lòng thử lại sau.',
  AUTH_REQUIRED: 'Vui lòng đăng nhập để thực hiện tác vụ này.',
  FORBIDDEN: 'Bạn không có quyền thực hiện hành động này.',
  INVALID_TOKEN: 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.',

  // Workspace
  WORKSPACE_NOT_FOUND: 'Không tìm thấy không gian làm việc.',
  WORKSPACE_ALREADY_EXISTS: 'Tên hoặc Slug của không gian làm việc đã tồn tại.',

  // Project
  PROJECT_NOT_FOUND: 'Không tìm thấy dự án.',
  PROJECT_ALREADY_EXISTS: 'Dự án đã tồn tại trong không gian này.',

  // Task
  TASK_NOT_FOUND: 'Không tìm thấy công việc.',
  TASK_ALREADY_ARCHIVED: 'Công việc này đã được đưa vào kho lưu trữ.',

  // AI & Others
  AI_LIMIT_REACHED: 'Bạn đã đạt giới hạn sử dụng AI cho hôm nay.',
  RATE_LIMIT_EXCEEDED: 'Bạn đang thao tác quá nhanh. Vui lòng chậm lại một chút.',
};

/**
 * Get a localized error message from an error code or a generic message.
 */
export function getErrorMessage(code?: string, defaultMessage = 'Đã có lỗi xảy ra'): string {
  if (!code) return defaultMessage;
  return ERROR_MESSAGES[code] || defaultMessage;
}

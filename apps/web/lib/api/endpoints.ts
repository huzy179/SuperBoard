export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
  },
  projects: {
    list: '/api/v1/projects',
    create: '/api/v1/projects',
    dashboard: '/api/v1/projects/dashboard',
    detail: (projectId: string) => `/api/v1/projects/${projectId}`,
    update: (projectId: string) => `/api/v1/projects/${projectId}`,
    delete: (projectId: string) => `/api/v1/projects/${projectId}`,
    createTask: (projectId: string) => `/api/v1/projects/${projectId}/tasks`,
    bulkTask: (projectId: string) => `/api/v1/projects/${projectId}/tasks/bulk`,
    updateTaskStatus: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/status`,
    updateTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    deleteTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    listComments: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
    createComment: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
    updateComment: (projectId: string, taskId: string, commentId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    deleteComment: (projectId: string, taskId: string, commentId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
  },
  notifications: {
    list: '/api/v1/notifications',
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: '/api/v1/notifications/read-all',
  },
  workspaces: {
    members: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members`,
    updateMember: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
  },
} as const;

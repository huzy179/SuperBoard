export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
  },
  projects: {
    list: '/api/v1/projects',
    create: '/api/v1/projects',
    detail: (projectId: string) => `/api/v1/projects/${projectId}`,
    update: (projectId: string) => `/api/v1/projects/${projectId}`,
    delete: (projectId: string) => `/api/v1/projects/${projectId}`,
    createTask: (projectId: string) => `/api/v1/projects/${projectId}/tasks`,
    updateTaskStatus: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/status`,
    updateTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    deleteTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
  },
} as const;

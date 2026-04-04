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
    delete: (projectId: string) => `/api/v1/projects/${projectId}`, // Actually Archive
    restore: (projectId: string) => `/api/v1/projects/${projectId}/restore`,
    createTask: (projectId: string) => `/api/v1/projects/${projectId}/tasks`,
    bulkTask: (projectId: string) => `/api/v1/projects/${projectId}/tasks/bulk`,
    updateTaskStatus: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/status`,
    updateTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    deleteTask: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}`,
    taskHistory: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/history`,
    listComments: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
    createComment: (projectId: string, taskId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
    updateComment: (projectId: string, taskId: string, commentId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    deleteComment: (projectId: string, taskId: string, commentId: string) =>
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}`,
    archiveTask: (taskId: string) => `/api/v1/tasks/${taskId}/archive`,
    restoreTask: (taskId: string) => `/api/v1/tasks/${taskId}/restore`,
    uploadAttachment: (taskId: string) => `/api/v1/upload/tasks/${taskId}`,
    deleteAttachment: (attachmentId: string) => `/api/v1/upload/attachments/${attachmentId}`,
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
  workflow: {
    workspaceStatuses: (workspaceId: string) =>
      `/api/v1/workflow/workspace/${workspaceId}/statuses`,
    projectStatuses: (projectId: string) => `/api/v1/workflow/project/${projectId}/statuses`,
    projectWorkflow: (projectId: string) => `/api/v1/workflow/project/${projectId}`,
    statusDetail: (projectId: string, statusId: string) =>
      `/api/v1/workflow/project/${projectId}/statuses/${statusId}`,
    transitions: (projectId: string) => `/api/v1/workflow/project/${projectId}/transitions`,
  },
};

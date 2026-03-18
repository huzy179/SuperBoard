export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
  },
  projects: {
    list: '/api/v1/projects',
  },
} as const;

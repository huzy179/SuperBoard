export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    session: ['auth', 'session'] as const,
    currentUser: ['currentUser'] as const,
    preferences: ['auth', 'preferences'] as const,
  },
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all] as const,
    detail: (projectId: string, showArchived = false) =>
      [...queryKeys.projects.all, projectId, { showArchived }] as const,
    taskHistory: (projectId: string, taskId: string) =>
      [...queryKeys.projects.all, projectId, 'tasks', taskId, 'history'] as const,
    predictiveHealth: (projectId: string) =>
      [...queryKeys.projects.all, projectId, 'predictive-health'] as const,
  },
  tasks: {
    all: ['tasks'] as const,
    intelligence: (taskId: string) => [...queryKeys.tasks.all, taskId, 'intelligence'] as const,
    relatedDocs: (taskNumber?: number | null) =>
      [...queryKeys.tasks.all, taskNumber, 'related-docs'] as const,
  },
  workspaces: {
    all: ['workspaces'] as const,
    detail: (workspaceId: string) => ['workspace', workspaceId] as const,
    members: (workspaceId: string) => ['workspace-members', workspaceId] as const,
    invitations: (workspaceId: string) => ['workspace-invitations', workspaceId] as const,
    invitation: (token: string) => ['workspace-invitation', token] as const,
  },
  notifications: {
    all: ['notifications'] as const,
  },
  automation: {
    all: ['automation'] as const,
    rules: (workspaceId?: string, projectId?: string) =>
      ['automation-rules', workspaceId, projectId] as const,
    proposals: (workspaceId: string) =>
      [...queryKeys.automation.all, 'proposals', workspaceId] as const,
    health: (workspaceId: string) => [...queryKeys.automation.all, 'health', workspaceId] as const,
    agentLogs: (workspaceId: string, projectId?: string) =>
      [...queryKeys.automation.all, 'agent-logs', workspaceId, projectId] as const,
  },
  ai: {
    all: ['ai'] as const,
    workspaceDigest: (workspaceId: string) =>
      [...queryKeys.ai.all, 'workspace-digest', workspaceId] as const,
    projectBriefing: (projectId: string) =>
      [...queryKeys.ai.all, 'project-briefing', projectId] as const,
  },
  knowledge: {
    all: ['knowledge'] as const,
    atlas: [...['knowledge'], 'atlas'] as const,
    diagnosis: [...['knowledge'], 'diagnosis'] as const,
    graph: (projectId: string) => [...queryKeys.knowledge.all, 'graph', projectId] as const,
    divergence: [...['knowledge'], 'divergence'] as const,
  },
  docs: {
    all: ['docs'] as const,
    list: (workspaceId?: string) => ['docs', workspaceId] as const,
    detail: (docId: string) => ['doc', docId] as const,
    versions: (docId: string) => ['doc-versions', docId] as const,
    public: (docId: string) => ['public-doc', docId] as const,
  },
  chat: {
    channels: (workspaceId?: string) => ['channels', workspaceId] as const,
    messages: (channelId?: string) => ['messages', channelId] as const,
    thread: (messageId?: string) => ['messages', 'thread', messageId] as const,
  },
  reports: {
    project: (projectId: string) => ['project-report', projectId] as const,
  },
  dashboard: {
    stats: ['dashboard-stats'] as const,
  },
  search: {
    global: (query: string) => ['search', query] as const,
    status: ['search', 'status'] as const,
    answer: (query: string) => ['search', 'answer', query] as const,
  },
};

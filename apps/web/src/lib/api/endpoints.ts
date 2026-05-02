export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    me: '/api/v1/auth/me',
    preferences: '/api/v1/auth/me/preferences',
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
    batchCreateTasks: (projectId: string) => `/api/v1/projects/${projectId}/tasks/batch`,
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
    summarizeTask: (taskId: string) => `/api/v1/tasks/${taskId}/summarize`,
    aiDecompose: (taskId: string) => `/api/v1/tasks/${taskId}/ai/decompose`,
    aiRefine: (taskId: string) => `/api/v1/tasks/${taskId}/ai/refine`,
    aiIntelligence: (taskId: string) => `/api/v1/tasks/${taskId}/ai/intelligence`,
    plan: (projectId: string) => `/api/v1/projects/${projectId}/plan`,
    syncStatuses: (projectId: string) => `/api/v1/projects/${projectId}/statuses/sync`,
    chronology: (projectId: string) => `/api/v1/projects/${projectId}/chronology`,
    briefing: (projectId: string) => `/api/v1/projects/${projectId}/briefing`,
    generateBriefing: (projectId: string) => `/api/v1/projects/${projectId}/generate-briefing`,
    forecast: (projectId: string) => `/api/v1/projects/${projectId}/forecast`,
    simulate: (projectId: string) => `/api/v1/projects/${projectId}/simulate`,
    predictiveHealth: (projectId: string) => `/api/v1/projects/${projectId}/predictive-health`,
    reports: (projectId: string) => `/api/v1/projects/${projectId}/reports`,
    export: (projectId: string) => `/api/v1/projects/${projectId}/export`,
    exportJson: (projectId: string) => `/api/v1/projects/${projectId}/export/json`,
  },
  notifications: {
    list: '/api/v1/notifications',
    markRead: (id: string) => `/api/v1/notifications/${id}/read`,
    markAllRead: '/api/v1/notifications/read-all',
  },
  workspaces: {
    list: '/api/v1/workspaces',
    detail: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}`,
    update: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}`,
    members: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members`,
    updateMember: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
    removeMember: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}`,
    leaveWorkspace: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/members/me`,
    transferOwnership: (workspaceId: string, memberId: string) =>
      `/api/v1/workspaces/${workspaceId}/members/${memberId}/transfer-owner`,
    invitations: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/invitations`,
    createInvitation: (workspaceId: string) => `/api/v1/workspaces/${workspaceId}/invitations`,
    revokeInvitation: (workspaceId: string, invitationId: string) =>
      `/api/v1/workspaces/${workspaceId}/invitations/${invitationId}`,
    getInvitation: (token: string) => `/api/v1/workspaces/invitations/${token}`,
    acceptInvitation: (token: string) => `/api/v1/workspaces/invitations/${token}/accept`,
  },
  workflow: {
    workspaceStatuses: (workspaceId: string) =>
      `/api/v1/workflow/workspace/${workspaceId}/statuses`,
    workspaceWorkflow: (workspaceId: string) => `/api/v1/workflow/workspace/${workspaceId}`,
    workspaceStatusDetail: (workspaceId: string, statusId: string) =>
      `/api/v1/workflow/workspace/${workspaceId}/statuses/${statusId}`,
    workspaceTransitions: (workspaceId: string) =>
      `/api/v1/workflow/workspace/${workspaceId}/transitions`,
    syncTemplate: (workspaceId: string) => `/api/v1/workflow/workspace/${workspaceId}/sync`,
    projectStatuses: (projectId: string) => `/api/v1/workflow/project/${projectId}/statuses`,
    projectWorkflow: (projectId: string) => `/api/v1/workflow/project/${projectId}`,
    statusDetail: (projectId: string, statusId: string) =>
      `/api/v1/workflow/project/${projectId}/statuses/${statusId}`,
    transitions: (projectId: string) => `/api/v1/workflow/project/${projectId}/transitions`,
  },
  search: {
    global: (query: string) => `/api/v1/search?q=${encodeURIComponent(query)}`,
    answer: '/api/v1/search/answer',
    status: '/api/v1/search/sync-status',
    relatedDocs: (taskNumber: number, taskTitle: string) =>
      `/api/v1/search/related-docs?taskNumber=${taskNumber}&taskTitle=${encodeURIComponent(taskTitle)}`,
  },
  upload: {
    avatar: '/api/v1/upload/avatar',
  },
  chat: {
    channels: (workspaceId: string) => `/api/v1/chat/channels?workspaceId=${workspaceId}`,
    createChannel: (workspaceId: string) => `/api/v1/chat/channel?workspaceId=${workspaceId}`,
    dm: (workspaceId: string) => `/api/v1/chat/dm?workspaceId=${workspaceId}`,
    findDm: (workspaceId: string, otherUserId: string) =>
      `/api/v1/chat/dm?workspaceId=${workspaceId}&otherUserId=${encodeURIComponent(otherUserId)}`,
    joinChannel: (channelId: string) => `/api/v1/chat/channels/${channelId}/join`,
    members: (channelId: string) => `/api/v1/chat/channels/${channelId}/members`,
    addMember: (channelId: string) => `/api/v1/chat/channels/${channelId}/members`,
    updateChannel: (channelId: string) => `/api/v1/chat/channels/${channelId}`,
    leaveChannel: (channelId: string) => `/api/v1/chat/channels/${channelId}/members/me`,
    messages: (channelId: string) => `/api/v1/chat/channels/${channelId}/messages`,
    sendMessage: (channelId: string) => `/api/v1/chat/channels/${channelId}/messages`,
    threadMessages: (messageId: string) => `/api/v1/chat/messages/${messageId}/thread`,
  },
  docs: {
    list: (workspaceId: string) => `/api/v1/docs?workspaceId=${workspaceId}`,
    create: (workspaceId: string) => `/api/v1/docs?workspaceId=${workspaceId}`,
    detail: (docId: string) => `/api/v1/docs/${docId}`,
    public: (shareToken: string) => `/api/v1/docs/public/${shareToken}`,
    update: (docId: string) => `/api/v1/docs/${docId}`,
    delete: (docId: string) => `/api/v1/docs/${docId}`,
    versions: (docId: string) => `/api/v1/docs/${docId}/versions`,
    restore: (docId: string, versionId: string) => `/api/v1/docs/${docId}/restore/${versionId}`,
  },
  executive: {
    adaptiveLayout: '/api/v1/executive/adaptive-layout',
    navigationFocus: '/api/v1/executive/navigation-focus',
    dailyBriefing: '/api/v1/executive/daily-briefing',
    projectBriefing: (projectId: string) => `/api/v1/executive/projects/${projectId}/briefing`,
    projectSimulation: (projectId: string) => `/api/v1/executive/projects/${projectId}/simulate`,
    projectMemoirs: (projectId: string) => `/api/v1/executive/projects/${projectId}/memoirs`,
    projectMemoir: (projectId: string) => `/api/v1/executive/projects/${projectId}/memoir`,
  },
  ai: {
    workspaceDigest: (workspaceId: string) => `/api/v1/ai/workspace/${workspaceId}/digest`,
    projectBriefing: (projectId: string) => `/api/v1/ai/projects/${projectId}/briefing`,
    projectChat: (projectId: string) => `/api/v1/ai/projects/${projectId}/chat`,
    summarizeDoc: (docId: string) => `/api/v1/ai/docs/${docId}/summarize`,
    processText: '/api/v1/ai/text/process',
    summarizeThread: (messageId: string) => `/api/v1/ai/messages/${messageId}/summarize`,
    datasetExport: '/api/v1/ai/dataset/export',
  },
  automation: {
    pulse: '/api/v1/automation/pulse',
    proposals: '/api/v1/automation/proposals',
    approveProposal: (proposalId: string) => `/api/v1/automation/proposals/${proposalId}/approve`,
    health: '/api/v1/automation/health',
    heal: '/api/v1/automation/heal',
    rules: '/api/v1/automation',
    rule: (ruleId: string) => `/api/v1/automation/${ruleId}`,
    generateRule: '/api/v1/automation/generate',
    agentLogs: '/api/v1/automation/agents/logs',
    executiveDirective: '/api/v1/automation/executive/directive',
    executeExecutiveDirective: (directiveId: string) =>
      `/api/v1/automation/executive/directive/${directiveId}/execute`,
    consciousnessStream: '/api/v1/automation/consciousness/stream',
  },
  knowledge: {
    graph: (projectId: string) => `/api/v1/knowledge/graph/${projectId}`,
    diary: (projectId: string) => `/api/v1/knowledge/diary/${projectId}`,
    atlas: '/api/v1/knowledge/atlas',
    // Note: API implements these routes as `silo-check` and `strategic-divergence`.
    // Keep names stable on FE for readability.
    diagnosis: '/api/v1/knowledge/silo-check',
    divergence: '/api/v1/knowledge/strategic-divergence',
  },
  connect: {
    integrations: '/api/v1/connect/integrations',
    integration: (integrationId: string) => `/api/v1/connect/integrations/${integrationId}`,
  },
  qa: {
    diagnoseManual: '/api/v1/qa/diagnose/manual',
    generateSpec: '/api/v1/qa/generate-spec',
  },
  talent: {
    taskSuggestions: (taskId: string) => `/api/v1/talent/tasks/${taskId}/suggestions`,
  },
};

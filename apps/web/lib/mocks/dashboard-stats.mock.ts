import type { DashboardStatsDTO, TaskEventTypeDTO } from '@superboard/shared';

function toIsoBeforeHours(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function getMockDashboardStats(): DashboardStatsDTO {
  const recentActivityTypes: TaskEventTypeDTO[] = [
    'created',
    'status_changed',
    'comment_added',
    'updated',
    'assignee_changed',
  ];

  return {
    tasksByStatus: [
      { status: 'todo', count: 12 },
      { status: 'in_progress', count: 8 },
      { status: 'review', count: 4 },
      { status: 'done', count: 17 },
    ],
    tasksByPriority: [
      { priority: 'low', count: 6 },
      { priority: 'medium', count: 18 },
      { priority: 'high', count: 12 },
      { priority: 'urgent', count: 5 },
    ],
    tasksByType: [
      { type: 'task', count: 20 },
      { type: 'bug', count: 9 },
      { type: 'story', count: 8 },
      { type: 'epic', count: 4 },
    ],
    tasksByAssignee: [
      {
        assigneeId: 'mock-user-1',
        assigneeName: 'Nguyễn Minh Tuấn',
        avatarColor: '#2563eb',
        count: 9,
      },
      {
        assigneeId: 'mock-user-2',
        assigneeName: 'Trần Bảo Ngọc',
        avatarColor: '#9333ea',
        count: 7,
      },
      {
        assigneeId: 'mock-user-3',
        assigneeName: 'Lê Quốc Anh',
        avatarColor: '#16a34a',
        count: 5,
      },
    ],
    tasksByProject: [
      {
        projectId: 'mock-project-1',
        projectName: 'Nâng cấp Jira Core',
        projectKey: 'JIRA',
        color: '#2563eb',
        total: 18,
        done: 7,
      },
      {
        projectId: 'mock-project-2',
        projectName: 'Dashboard Insight',
        projectKey: 'DASH',
        color: '#9333ea',
        total: 14,
        done: 10,
      },
      {
        projectId: 'mock-project-3',
        projectName: 'Notification UX',
        projectKey: 'NTF',
        color: '#16a34a',
        total: 9,
        done: 5,
      },
    ],
    overdueTasks: 3,
    recentActivity: Array.from({ length: 6 }, (_, index) => ({
      id: `mock-activity-${index + 1}`,
      type: recentActivityTypes[index % recentActivityTypes.length] ?? 'updated',
      taskTitle: `Task mẫu #${index + 1}`,
      actorName: index % 2 === 0 ? 'Nguyễn Minh Tuấn' : 'Trần Bảo Ngọc',
      createdAt: toIsoBeforeHours(index + 1),
    })),
  };
}

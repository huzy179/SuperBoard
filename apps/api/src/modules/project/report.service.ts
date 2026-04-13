import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  subDays,
  startOfDay,
  endOfDay,
  isBefore,
  isAfter,
} from 'date-fns';
import type {
  ProjectReportDTO,
  BurndownPointDTO,
  CumulativeFlowPointDTO,
  HealthMetricsDTO,
} from '@superboard/shared';

@Injectable()
export class ReportService {
  constructor(private prisma: PrismaService) {}

  async getProjectReport(projectId: string): Promise<ProjectReportDTO> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {},
          include: {
            assignee: { select: { fullName: true } },
            events: {
              where: { type: 'status_changed' },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const tasks = project.tasks;

    // 1. Velocity (Last 6 Months)
    const velocity: ProjectReportDTO['velocity'] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMM yyyy');

      const completedInMonth = tasks.filter((t) => {
        if (t.status !== 'done') return false;
        // Approximation: using updatedAt as completion date if it's in 'done' status
        return t.updatedAt >= start && t.updatedAt <= end;
      });

      velocity.push({
        label: monthLabel,
        points: completedInMonth.reduce((sum, t) => sum + (t.storyPoints || 0), 0),
        taskCount: completedInMonth.length,
      });
    }

    // 2. Status Distribution
    const statusCounts = new Map<string, number>();
    for (const t of tasks) {
      statusCounts.set(t.status, (statusCounts.get(t.status) ?? 0) + 1);
    }
    const distribution: ProjectReportDTO['distribution'] = Array.from(statusCounts.entries()).map(
      ([status, count]) => ({
        status,
        count,
      }),
    );

    // 3. Workload
    const workloadMap = new Map<string, { name: string; count: number }>();
    for (const t of tasks) {
      if (t.assigneeId && t.assignee) {
        const existing = workloadMap.get(t.assigneeId);
        if (existing) {
          existing.count++;
        } else {
          workloadMap.set(t.assigneeId, { name: t.assignee.fullName, count: 1 });
        }
      }
    }
    const workload: ProjectReportDTO['workload'] = Array.from(workloadMap.entries()).map(
      ([id, data]) => ({
        assigneeId: id,
        assigneeName: data.name,
        count: data.count,
      }),
    );

    // 4. Metrics & Cycle Time
    let totalCycleTimeMs = 0;
    let cycleTimeCount = 0;

    for (const t of tasks) {
      if (t.status === 'done' && t.events.length > 0) {
        // Find first entry into an "Active" state (any status that is not the first one)
        // For simplicity, we compare with the first event or creation
        const startEvent = t.events.find((e) => {
          const payload = e.payload as Record<string, unknown>;
          return payload?.to !== 'todo'; // Simplification: move out of todo
        });

        const endEvent = [...t.events].reverse().find((e) => {
          const payload = e.payload as Record<string, unknown>;
          return payload?.to === 'done';
        });

        if (startEvent && endEvent) {
          const duration = endEvent.createdAt.getTime() - startEvent.createdAt.getTime();
          if (duration > 0) {
            totalCycleTimeMs += duration;
            cycleTimeCount++;
          }
        }
      }
    }

    const totalStoryPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedStoryPoints = tasks
      .filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // 5. Health Metrics
    const now = new Date();
    const health: HealthMetricsDTO = {
      overdueCount: tasks.filter(
        (t) => t.status !== 'done' && t.dueDate && isBefore(t.dueDate, now),
      ).length,
      unassignedCount: tasks.filter((t) => !t.assigneeId).length,
      staleCount: tasks.filter((t) => t.status !== 'done' && isBefore(t.updatedAt, subDays(now, 7)))
        .length,
      totalTasks: tasks.length,
    };

    // 6. Burndown & CFD (Last 14 days)
    const burndown = this.calculateBurndown(tasks, 14);
    const cumulativeFlow = this.calculateCumulativeFlow(tasks, 14);

    return {
      velocity,
      distribution,
      workload,
      health,
      burndown,
      cumulativeFlow,
      metrics: {
        avgCycleTimeDays:
          cycleTimeCount > 0 ? totalCycleTimeMs / (1000 * 60 * 60 * 24 * cycleTimeCount) : 0,
        totalStoryPoints,
        completedStoryPoints,
        completionRate: totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0,
        activeTaskCount: tasks.filter((t) => t.status !== 'done').length,
      },
    };
  }

  private calculateBurndown(tasks: Record<string, unknown>[], days: number): BurndownPointDTO[] {
    const points: BurndownPointDTO[] = [];
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    for (let i = days; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));

      // Points remaining on this date
      // A task is considered "not done" if it was not 'done' OR it became 'done' AFTER this date
      const remainingPoints = tasks.reduce((sum, t) => {
        const doneEvent = t.events.find((e: Record<string, unknown>) => {
          const payload = e.payload as Record<string, unknown>;
          return payload?.to === 'done' && isBefore(e.createdAt as Date, endOfDay(date));
        });

        // If task is currently done AND it was done before/on this date, it doesn't count towards remaining
        if (t.status === 'done' && doneEvent) {
          return sum;
        }
        return sum + (t.storyPoints || 0);
      }, 0);

      // Ideal points: simple linear regression from total to 0
      const idealPoints = Math.max(0, totalPoints - (totalPoints / days) * (days - i));

      points.push({
        date: format(date, 'MMM dd'),
        remainingPoints,
        idealPoints: Math.round(idealPoints * 10) / 10,
      });
    }
    return points;
  }

  private calculateCumulativeFlow(
    tasks: Record<string, unknown>[],
    days: number,
  ): CumulativeFlowPointDTO[] {
    const points: CumulativeFlowPointDTO[] = [];

    // Get all unique statuses
    const statuses = Array.from(new Set(tasks.map((t) => t.status)));

    for (let i = days; i >= 0; i--) {
      const date = endOfDay(subDays(new Date(), i));
      const point: CumulativeFlowPointDTO = { date: format(date, 'MMM dd') };

      // Initialize counts
      statuses.forEach((s) => (point[s] = 0));

      tasks.forEach((t) => {
        // Find the status of this task at the end of 'date'
        // We look at events before 'date' and take the last one
        const statusEvents = t.events.filter((e: Record<string, unknown>) =>
          isBefore(e.createdAt as Date, date),
        );
        let statusAtDate = 'todo'; // Default starting status (could be improved by checking project defaults)

        if (statusEvents.length > 0) {
          statusAtDate = (statusEvents[statusEvents.length - 1].payload as Record<string, unknown>)
            .to as string;
        } else if (isAfter(t.createdAt as Date, date)) {
          // Task didn't exist yet
          return;
        }

        if (point[statusAtDate] !== undefined) {
          (point[statusAtDate] as number)++;
        }
      });

      points.push(point);
    }
    return points;
  }

  async exportProjectTasksCsv(projectId: string): Promise<string> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { fullName: true } },
        labels: { include: { label: true } },
      },
      orderBy: { number: 'asc' },
    });

    const headers = [
      'Task #',
      'Title',
      'Type',
      'Status',
      'Priority',
      'Story Points',
      'Assignee',
      'Labels',
      'Created At',
      'Due Date',
    ];

    const rows = tasks.map((t) => [
      t.number || '',
      `"${t.title.replace(/"/g, '""')}"`,
      t.type,
      t.status,
      t.priority,
      t.storyPoints || 0,
      t.assignee?.fullName || 'Unassigned',
      `"${((t.labels as unknown as Record<string, unknown>[]) || []).map((l) => (l.label as Record<string, unknown>).name).join(', ')}"`,
      format(t.createdAt as Date, 'yyyy-MM-dd HH:mm'),
      t.dueDate ? format(t.dueDate, 'yyyy-MM-dd') : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async getPredictiveHealth(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const tasks = project.tasks;
    const doneTasks = tasks.filter((t) => t.status === 'done');
    const openTasks = tasks.filter((t) => t.status !== 'done');

    // Calculate Velocity (Story points per day over last 30 days)
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentDone = doneTasks.filter((t) => t.updatedAt >= thirtyDaysAgo);
    const totalPointsDone = recentDone.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const velocityPerDay = totalPointsDone / 30 || 1.0; // Fallback to 1 point/day

    const now = new Date();
    const predictiveResults = openTasks.map((task) => {
      // Simple linear projection
      const remainingPointsBeforeThis = openTasks
        .filter((t) => (t.position || '') < (task.position || ''))
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const daysToComplete = (remainingPointsBeforeThis + (task.storyPoints || 1)) / velocityPerDay;
      const estimatedDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000);

      const isAtRisk = task.dueDate ? isBefore(task.dueDate, estimatedDate) : false;

      return {
        taskId: task.id,
        title: task.title,
        status: task.status,
        estimatedCompletionDate: estimatedDate.toISOString(),
        isAtRisk,
        confidence: 0.75, // Baseline confidence
      };
    });

    return {
      projectId,
      velocityPerDay,
      predictions: predictiveResults,
      atRiskCount: predictiveResults.filter((p) => p.isAtRisk).length,
    };
  }

  async exportProjectTasksJson(projectId: string): Promise<string> {
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: { select: { fullName: true, avatarColor: true } },
        labels: { include: { label: true } },
        parentTask: { select: { title: true, number: true } },
      },
      orderBy: { number: 'asc' },
    });

    return JSON.stringify(tasks, null, 2);
  }
}

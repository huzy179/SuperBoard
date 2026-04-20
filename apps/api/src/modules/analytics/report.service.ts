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

import { AiService } from '../ai/ai.service';

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getPredictiveHealth(projectId: string) {
    return this.getStrategicHealth(projectId);
  }

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const burndown = this.calculateBurndown(tasks as any, 14);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cumulativeFlow = this.calculateCumulativeFlow(tasks as any, 14);

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

  private calculateBurndown(
    tasks: {
      storyPoints: number | null;
      status: string;
      events: { payload: Record<string, unknown>; createdAt: Date }[];
    }[],
    days: number,
  ): BurndownPointDTO[] {
    const points: BurndownPointDTO[] = [];
    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    for (let i = days; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));

      // Points remaining on this date
      // A task is considered "not done" if it was not 'done' OR it became 'done' AFTER this date
      const remainingPoints = tasks.reduce((sum, t) => {
        const doneEvent = t.events.find((e) => {
          const payload = e.payload;
          return payload?.to === 'done' && isBefore(e.createdAt, endOfDay(date));
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
    tasks: {
      status: string;
      events: { payload: Record<string, unknown>; createdAt: Date }[];
      createdAt: Date;
    }[],
    days: number,
  ): CumulativeFlowPointDTO[] {
    const points: CumulativeFlowPointDTO[] = [];

    // Get all unique statuses
    const statuses = Array.from(new Set(tasks.map((t) => t.status)));

    for (let i = days; i >= 0; i--) {
      const date = endOfDay(subDays(new Date(), i));
      const point: CumulativeFlowPointDTO = { date: format(date, 'MMM dd') };

      // Initialize counts
      statuses.forEach((s) => (point[s as keyof CumulativeFlowPointDTO] = 0));

      tasks.forEach((t) => {
        // Find the status of this task at the end of 'date'
        // We look at events before 'date' and take the last one
        const statusEvents = t.events.filter((e) => isBefore(e.createdAt, date));
        let statusAtDate = 'todo'; // Default starting status (could be improved by checking project defaults)

        if (statusEvents.length > 0) {
          const lastEvent = statusEvents[statusEvents.length - 1];
          const lastPayload = lastEvent?.payload as Record<string, unknown>;
          statusAtDate = (lastPayload?.to as string) || 'todo';
        } else if (isAfter(t.createdAt, date)) {
          // Task didn't exist yet
          return;
        }

        if (point[statusAtDate as keyof CumulativeFlowPointDTO] !== undefined) {
          (point[statusAtDate as keyof CumulativeFlowPointDTO] as number)++;
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
      `"${((t.labels as unknown as { label: { name: string } }[]) || []).map((l) => l.label.name).join(', ')}"`,
      format(t.createdAt as Date, 'yyyy-MM-dd HH:mm'),
      t.dueDate ? format(t.dueDate, 'yyyy-MM-dd') : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  async getVelocityForecasting(
    projectId: string,
    adjustments?: {
      velocityBoost?: number;
      excludedTaskIds?: string[];
      priorityShiftIds?: string[];
    },
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {
            deletedAt: null,
            id: { notIn: adjustments?.excludedTaskIds ?? [] },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const tasks = project.tasks;
    const doneTasks = tasks.filter((t) => t.status === 'done');
    let openTasks = tasks.filter((t) => t.status !== 'done');

    // Apply priority shift simulation
    if (adjustments?.priorityShiftIds) {
      const shifted = adjustments.priorityShiftIds
        .map((id) => openTasks.find((t) => t.id === id))
        .filter((t): t is (typeof openTasks)[0] => !!t);
      const others = openTasks.filter((t) => !adjustments.priorityShiftIds?.includes(t.id));
      openTasks = [...shifted, ...others];
    }

    // Calculate Velocity
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentDone = doneTasks.filter((t) => t.updatedAt >= thirtyDaysAgo);
    const totalPointsDone = recentDone.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    let velocityPerDay = totalPointsDone / 30 || 1.0;

    // Apply Velocity Boost Simulation
    if (adjustments?.velocityBoost) {
      velocityPerDay *= 1 + adjustments.velocityBoost;
    }

    const now = new Date();
    const predictiveResults = openTasks.map((task, index) => {
      const remainingPointsBeforeThis = openTasks
        .slice(0, index)
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
        confidence: 0.75 + (adjustments ? -0.1 : 0),
      };
    });

    return {
      projectId,
      velocityPerDay,
      predictions: predictiveResults,
      atRiskCount: predictiveResults.filter((p) => p.isAtRisk).length,
    };
  }

  async getStrategicHealth(projectId: string) {
    const report = await this.getProjectReport(projectId);
    const forecast = await this.getVelocityForecasting(projectId);

    // Calculate Neural Health Score (Heuristic)
    // - 100% baseline
    // - Minus 10% per at-risk prediction
    // - Minus 5% if velocity < 1.0
    // - Plus 10% if velocity > 5.0
    let healthScore = 100;
    healthScore -= forecast.atRiskCount * 10;
    if (forecast.velocityPerDay < 1) healthScore -= 15;
    if (forecast.velocityPerDay > 5) healthScore += 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    const executiveBrief = await this.aiService.generateExecutiveSummary(projectId, {
      healthScore,
      velocity: forecast.velocityPerDay,
      atRiskCount: forecast.atRiskCount,
      distribution: report.distribution,
      topRisks: forecast.predictions.filter((p) => p.isAtRisk).slice(0, 3),
    });

    return {
      healthScore,
      executiveBrief,
      forecast,
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

  async generateProjectMemoir(projectId: string, persona: string = 'executive') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            comments: true,
            events: true,
          },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    // 1. Context Synthesis
    const tasks = project.tasks;
    const comments = tasks.flatMap((t) => t.comments);
    const agentActions = await this.prisma.agentAction.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
    const signals = await this.prisma.signalLog.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });

    const missionLog = [
      `Project: ${project.name}`,
      `History:`,
      ...tasks.map((t) => `[Task] ${t.title}: ${t.status} (Events: ${t.events.length})`),
      ...comments
        .slice(0, 50)
        .map((c: { content: string }) => `[Comment] ${c.content.slice(0, 100)}`),
      ...agentActions.map((a) => `[AI Action] ${a.agentName}: ${a.reason}`),
      ...signals.map((s) => `[Signal] ${s.provider}: ${s.interpretation}`),
    ].join('\n');

    // 2. AI Narrative Generation
    const prompt = `
        Mission Context Log:
        ${missionLog}

        Target Persona: ${persona}

        Generate a high-fidelity "Project Memoir" (Story-style chronicle) of this mission.
        Focus on:
        - The initial spark/goal.
        - The unexpected obstacles (blockers/signals).
        - The turning points (AI interventions/key comments).
        - The resolution and future legacy.

        Format: Professional Markdown with cinematic headers.
    `;

    const content = await this.aiService.processText(prompt, 'narrative_biographer');
    const title = `Chronicle of ${project.name}: ${new Date().toLocaleDateString()}`;

    // 3. Persist
    return this.prisma.projectMemoir.create({
      data: {
        projectId,
        title,
        content,
        persona,
      },
    });
  }

  async getProjectMemoirs(projectId: string) {
    return this.prisma.projectMemoir.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getNeuralDailyBriefing(workspaceId: string) {
    const twentyFourHoursAgo = subDays(new Date(), 1);

    // 1. Data Aggregation
    const [tasks, comments, signals, actions] = await Promise.all([
      this.prisma.task.findMany({
        where: { project: { workspaceId }, updatedAt: { gte: twentyFourHoursAgo } },
        include: { project: { select: { name: true } } },
      }),
      this.prisma.comment.findMany({
        where: { task: { project: { workspaceId } }, createdAt: { gte: twentyFourHoursAgo } },
      }),
      this.prisma.signalLog.findMany({
        where: { workspaceId, createdAt: { gte: twentyFourHoursAgo } },
      }),
      this.prisma.agentAction.findMany({
        where: { workspaceId, createdAt: { gte: twentyFourHoursAgo } },
      }),
    ]);

    // 2. Multi-Dimensional Synthesis
    const activityLog = [
      `Active Tasks: ${tasks.length}`,
      ...tasks.map((t) => `[${t.project.name}] ${t.title}: ${t.status}`),
      `Recent Comments: ${comments.length}`,
      ...comments.slice(0, 10).map((c) => `[Comment] ${c.content.slice(0, 50)}...`),
      `Ecosystem Signals: ${signals.length}`,
      ...signals.slice(0, 10).map((s) => `[${s.provider}] ${s.interpretation}`),
      `Neural Actions: ${actions.length}`,
      ...actions.slice(0, 10).map((a) => `[${a.agentName}] ${a.reason}`),
    ].join('\n');

    const prompt = `
        Active Log (Last 24 Hours):
        ${activityLog}

        Provide a strategic "Daily Command Briefing":
        1. "The Pulse": Synthesize the emotional and operational vibe (1-2 sentences).
        2. "Command Intent": Top 3 critical tactical priorities based on activity and signals.
        3. "Neural Highlights": Summary of what the AI agents did to help.

        Format: Professional, structured JSON: { pulse: string, commandIntent: string[], highlights: string[] }
    `;

    const rawBriefing = await this.aiService.processText(prompt, 'executive_daily_briefing');

    try {
      return JSON.parse(rawBriefing);
    } catch {
      return {
        pulse: 'Operational rhythm is steady, but external signals are growing more complex.',
        commandIntent: [
          'Sync Mission trajectories',
          'Review recent Slack signals',
          'Audit blocker resolutions',
        ],
        highlights: ['Neural Agents optimized 5 new missions', 'Redundancy scan complete'],
      };
    }
  }

  async getAdaptiveLayout(workspaceId: string) {
    const briefing = await this.getNeuralDailyBriefing(workspaceId);

    const prompt = `
        Current Command Intent: ${briefing.commandIntent.join(', ')}
        The Pulse: ${briefing.pulse}

        Based on these priorities, determine the optimal "Liquid UI" layout for the Strategic Dashboard.
        Available Modules:
        - STATS: Top-level metric cards.
        - MATRIX: Distribution donut charts.
        - EFFICIENCY: Completion intelligence bars.
        - SIGNALS: Active signal stream (Slack/GitHub).
        - VECTORS: Attention vectors (critical projects).
        - CAPACITY: Operator workload distribution.
        - TAXONOMY: Protocol classification bar chart.

        Return a JSON array of these modules ordered by "Strategic Importance" for TODAY.
        Include 'focus: true' for the most critical module.
        Format: [{ id: string, order: number, focus: boolean }]
    `;

    const rawLayout = await this.aiService.processText(prompt, 'ui_layout_orchestrator');

    try {
      return JSON.parse(rawLayout);
    } catch {
      return [
        { id: 'STATS', order: 0, focus: false },
        { id: 'VECTORS', order: 1, focus: true },
        { id: 'SIGNALS', order: 2, focus: false },
        { id: 'MATRIX', order: 3, focus: false },
        { id: 'EFFICIENCY', order: 4, focus: false },
        { id: 'CAPACITY', order: 5, focus: false },
        { id: 'TAXONOMY', order: 6, focus: false },
      ];
    }
  }

  async getNavigationFocus(workspaceId: string) {
    const briefing = await this.getNeuralDailyBriefing(workspaceId);

    const prompt = `
        Current Command Intent: ${briefing.commandIntent.join(', ')}
        The Pulse: ${briefing.pulse}

        Identify which navigation sectors should be highlighted to guide the user toward these priorities.
        Available Sectors: DASHBOARD, PROJECTS, CHAT, DOCS, NOTIFICATIONS, SETTINGS

        Return a JSON object: { highlights: [{ sector: string, reason: string }] }
        Only include sectors with direct relevance to the current intent.
    `;

    const rawFocus = await this.aiService.processText(prompt, 'navigation_strategist');

    try {
      return JSON.parse(rawFocus);
    } catch {
      return {
        highlights: [{ sector: 'DASHBOARD', reason: 'Review high-level strategic alignment' }],
      };
    }
  }
}

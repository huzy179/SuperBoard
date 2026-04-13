import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { TalentService } from '../talent/talent.service';

@Injectable()
export class NeuralAgentService {
  private readonly logger = new Logger(NeuralAgentService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private talentService: TalentService,
  ) {}

  async processEvent(event: {
    taskId: string;
    workspaceId: string;
    projectId: string;
    type: string;
    payload: Record<string, unknown>;
  }) {
    this.logger.log(`Agent Brain observing event: ${event.type} on task ${event.taskId}`);

    try {
      if (event.type === 'created') {
        await this.runTriageAgent(event);
      }

      if (event.type === 'status_changed') {
        await this.runSheriffAgent(event);
      }
    } catch (err) {
      this.logger.error('Agent brain execution failed', err);
    }
  }

  private async runTriageAgent(event: Record<string, unknown>) {
    const task = await this.prisma.task.findUnique({
      where: { id: event.taskId },
      select: { title: true, description: true },
    });

    if (!task) return;

    this.logger.log(`Triage Agent analyzing mission: ${task.title}`);

    // 1. Suggest Assignees
    const suggestions = await this.talentService.suggestAssignees(event.taskId, event.workspaceId);
    if (suggestions.length > 0) {
      const topPick = suggestions[0];

      // Autonomous Action: Assign User
      await this.prisma.task.update({
        where: { id: event.taskId },
        data: { assigneeId: topPick.id },
      });

      await this.logAction({
        workspaceId: event.workspaceId,
        projectId: event.projectId,
        agentName: 'TriageAgent',
        actionType: 'AUTO_ASSIGN',
        targetId: event.taskId,
        reason: `Automatically assigned Operator ${topPick.fullName} due to superior skill match (Score: ${topPick.score}).`,
      });
    }

    // 2. Semantic Triage
    const labelsStr = await this.aiService.processText(
      `Task: ${task.title}\nDescription: ${task.description}\n\nList relevant technical labels (comma separated).`,
      'extract_labels',
    );

    this.logger.log(`Triage Agent suggested labels: ${labelsStr}`);
  }

  private async runSheriffAgent(event: Record<string, unknown>) {
    const { to } = event.payload as { from: string; to: string };
    if (to === 'blocked') {
      const task = await this.prisma.task.findUnique({
        where: { id: event.taskId },
        select: { title: true },
      });

      if (!task) return;

      // Autonomous Action: Post Guidance Comment
      const guidance = await this.aiService.processText(
        `Task "${task.title}" is now BLOCKED. Provide a short, strategic question to help resolve it.`,
        'strategic_guidance',
      );

      // In a real scenario, we'd have a CommentService. For now, we use prisma directly.
      const systemUser = await this.prisma.user.findFirst({ where: { role: 'admin' } });
      if (systemUser) {
        await this.prisma.comment.create({
          data: {
            taskId: event.taskId,
            authorId: systemUser.id,
            content: `🦾 **Neural Sheriff Intervention**: ${guidance}`,
          },
        });

        await this.logAction({
          workspaceId: event.workspaceId,
          projectId: event.projectId,
          agentName: 'SheriffAgent',
          actionType: 'POST_COMMENT',
          targetId: event.taskId,
          reason: `Mission reached 'BLOCKED' state. Provided strategic guidance to maintain momentum.`,
        });
      }
    }
  }

  private async logAction(data: {
    workspaceId: string;
    projectId?: string;
    agentName: string;
    actionType: string;
    targetId: string;
    reason: string;
  }) {
    await this.prisma.agentAction.create({
      data: {
        workspaceId: data.workspaceId,
        projectId: data.projectId || null,
        agentName: data.agentName,
        actionType: data.actionType,
        targetId: data.targetId,
        reason: data.reason,
      },
    });
  }
}

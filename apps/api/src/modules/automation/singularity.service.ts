import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { ChronologyService } from '../project/chronology.service';
import { NotificationService } from '../notification/notification.service';
import { SymbiosisService } from './symbiosis.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SingularityService {
  private readonly logger = new Logger(SingularityService.name);

  constructor(
    private prisma: PrismaService,
    private diagnosisService: DiagnosisService,
    private chronologyService: ChronologyService,
    private notificationService: NotificationService,
    private symbiosisService: SymbiosisService,
    private aiService: AiService,
  ) {}

  /**
   * The Singularity Pulse: Main autonomous orchestration loop
   */
  async pulseConsciousness(workspaceId: string) {
    this.logger.log(`Singularity Pulse initiated for workspace ${workspaceId}`);

    const operations = await Promise.all([
      this.healStrategicDivergence(workspaceId),
      this.detectAndNudgeInertia(workspaceId),
      this.symbiosisService.generateStrategicProposals(workspaceId),
    ]);

    const healingCount = operations[0];
    const nudgeCount = operations[1];

    this.logger.log(
      `Singularity Pulse complete. Operations: ${healingCount} healings, ${nudgeCount} nudges dispatched.`,
    );

    return {
      healed: healingCount,
      nudged: nudgeCount,
      timestamp: new Date().toISOString(),
    };
  }

  private async healStrategicDivergence(workspaceId: string): Promise<number> {
    const collisions = await this.diagnosisService.detectStrategicDivergence(workspaceId);
    let healedCount = 0;

    for (const collision of collisions as {
      intensity: number;
      nodes: { id: string; type: string }[];
    }[]) {
      // Only auto-heal high intensity collisions (>0.9)
      if (collision.intensity >= 0.9) {
        const [nodeA, nodeB] = collision.nodes;

        // Prevent duplicate links
        const existing = await this.prisma.taskLink.findFirst({
          where: {
            OR: [
              { sourceTaskId: nodeA.id, targetTaskId: nodeB.id },
              { sourceTaskId: nodeB.id, targetTaskId: nodeA.id },
            ],
          },
        });

        if (!existing && nodeA.type === 'task' && nodeB.type === 'task') {
          await this.prisma.taskLink.create({
            data: {
              sourceTaskId: nodeA.id,
              targetTaskId: nodeB.id,
              type: 'related',
            },
          });
          healedCount++;
          this.logger.log(`Autonomous Tactical Healing: Linked ${nodeA.id} <-> ${nodeB.id}`);
        }
      }
    }

    return healedCount;
  }

  private async detectAndNudgeInertia(workspaceId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stallingTasks = await this.prisma.task.findMany({
      where: {
        project: { workspaceId },
        status: { notIn: ['done', 'canceled'] },
        updatedAt: { lt: sevenDaysAgo },
        deletedAt: null,
      },
      include: { assignee: true, project: true },
    });

    let nudgeCount = 0;

    for (const task of stallingTasks) {
      if (!task.assigneeId) continue;

      const prompt = `Task "${task.title}" in Project "${task.project?.name}" has been stalling for 7 days.
      Assignee: ${task.assignee?.fullName || 'Unknown'}.
      Status: ${task.status}.
      
      Generate a 1-sentence strategic "Neural Nudge" to encourage progress. Be encouraging but tactical.`;

      const aiSummary = await this.aiService.processText(prompt, 'notification_prioritizer');

      await this.notificationService.createNotification({
        userId: task.assigneeId,
        title: 'Mission Inertia Detected',
        message: `Task #${task.number} is stalling. Tactical alignment required.`,
        type: 'SYSTEM',
        projectId: task.projectId,
        taskId: task.id,
        neuralPriority: 'STRATEGIC',
        aiSummary,
      });

      nudgeCount++;
    }

    return nudgeCount;
  }
}

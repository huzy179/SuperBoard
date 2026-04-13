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

    const thoughts: string[] = [];

    // 1. Strategic Consciousness
    thoughts.push('Analyzing workspace strategic integrity...');
    const divergenceHealed = await this.healStrategicDivergence(workspaceId);
    if (divergenceHealed > 0)
      thoughts.push(`Self-healed ${divergenceHealed} strategic divergences.`);

    // 2. Operational Inertia
    thoughts.push('Scanning for tactical inertia pulses...');
    const nudges = await this.detectAndNudgeInertia(workspaceId);
    if (nudges > 0) thoughts.push(`Dispatched ${nudges} neural nudges to stagnant nodes.`);

    // 3. Autonomous Optimization (New in Phase 55)
    thoughts.push('Initiating autonomous load rebalancing...');
    const optimizations = await this.performAutonomousOptimizations(workspaceId);
    if (optimizations > 0)
      thoughts.push(`Executed ${optimizations} autonomous micro-optimizations.`);

    // 4. Strategic Proposals
    thoughts.push('Projecting optimal structural convergences...');
    await this.symbiosisService.generateStrategicProposals(workspaceId);

    // Store the consciousness log
    await this.prisma.agentAction.create({
      data: {
        workspaceId,
        agentName: 'NeuralSingularity',
        actionType: 'CONSCIOUSNESS_PULSE',
        targetId: workspaceId,
        reason: 'Periodic consciousness cycle.',
        metadata: { thoughts, timestamp: new Date().toISOString() },
      },
    });

    return {
      thoughts,
      healed: divergenceHealed,
      nudged: nudges,
      optimized: optimizations,
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
      if (collision.intensity >= 0.9) {
        const [nodeA, nodeB] = collision.nodes;
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
      const prompt = `Task "${task.title}" stalled. Generate nudge.`;
      const aiSummary = await this.aiService.processText(prompt, 'notification_prioritizer');

      await this.notificationService.createNotification({
        userId: task.assigneeId,
        title: 'Mission Inertia Detected',
        message: `Task #${task.number} is stalling.`,
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

  private async performAutonomousOptimizations(workspaceId: string): Promise<number> {
    let optimizationCount = 0;
    const criticalProjects = await this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      include: { tasks: { where: { status: { notIn: ['done', 'canceled'] }, deletedAt: null } } },
    });

    for (const project of criticalProjects) {
      if (project.tasks.length > 20) {
        const oldestTasks = project.tasks
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .slice(0, 3);

        for (const task of oldestTasks) {
          if (task.priority !== 'high') {
            await this.prisma.task.update({
              where: { id: task.id },
              data: { priority: 'high' },
            });
            optimizationCount++;
          }
        }
      }
    }
    return optimizationCount;
  }
}

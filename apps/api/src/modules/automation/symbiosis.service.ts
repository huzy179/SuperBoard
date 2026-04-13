import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class SymbiosisService {
  private readonly logger = new Logger(SymbiosisService.name);

  constructor(
    private prisma: PrismaService,
    private diagnosisService: DiagnosisService,
    private aiService: AiService,
  ) {}

  /**
   * Generates high-impact strategic proposals for a workspace.
   */
  async generateStrategicProposals(workspaceId: string) {
    this.logger.log(`Generating Strategic Proposals for workspace ${workspaceId}`);

    // 1. Detect Potential Project Merges
    const projects = await this.prisma.project.findMany({
      where: { workspaceId, deletedAt: null },
      include: { tasks: { take: 1 } },
    });

    const proposals = [];

    // Analyze Cross-Project Collisions
    const collisions = await this.diagnosisService.detectStrategicDivergence(workspaceId);

    // Group collisions by project pairs
    const projectOverlaps: Record<string, number> = {};
    for (const collision of collisions as {
      intensity: number;
      nodes: { projectName: string }[];
    }[]) {
      const p1 = collision.nodes[0].projectName;
      const p2 = collision.nodes[1].projectName;
      const key = [p1, p2].sort().join('||');
      projectOverlaps[key] = (projectOverlaps[key] || 0) + collision.intensity;
    }

    for (const [key, intensitySum] of Object.entries(projectOverlaps)) {
      if (intensitySum > 1.5) {
        // Arbitrary threshold for "High Overlap"
        const [p1Name, p2Name] = key.split('||');
        const proj1 = projects.find((p) => p.name === p1Name);
        const proj2 = projects.find((p) => p.name === p2Name);

        if (proj1 && proj2) {
          await this.createProposal(workspaceId, {
            agentName: 'SingularityAgent',
            actionType: 'MERGE_PROJECTS',
            targetId: proj1.id,
            reason: `High semantic overlap detected between "${p1Name}" and "${p2Name}". Structural consolidation recommended to optimize resource allocation.`,
            metadata: {
              sourceProjectId: proj2.id,
              sourceProjectName: p2Name,
              targetProjectName: p1Name,
              overlapIntensity: intensitySum,
            },
          });
          proposals.push(key);
        }
      }
    }

    return proposals;
  }

  async getPendingProposals(workspaceId: string) {
    return this.prisma.agentAction.findMany({
      where: {
        workspaceId,
        agentName: 'SingularityAgent',
        actionType: 'MERGE_PROJECTS',
        // In our mini-impl, we use metadata.status to track approval
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveProposal(proposalId: string) {
    const proposal = await this.prisma.agentAction.findUnique({
      where: { id: proposalId },
    });

    if (!proposal) throw new NotFoundException('Proposal not found');

    const metadata = proposal.metadata as { sourceProjectId: string; status: string };
    if (proposal.actionType === 'MERGE_PROJECTS') {
      const sourceProjectId = metadata.sourceProjectId;
      const targetProjectId = proposal.targetId;

      // 1. Move all tasks from source to target
      await this.prisma.task.updateMany({
        where: { projectId: sourceProjectId },
        data: { projectId: targetProjectId },
      });

      // 2. Mark source project as archived/deleted
      await this.prisma.project.update({
        where: { id: sourceProjectId },
        data: { deletedAt: new Date() },
      });

      // 3. Mark proposal as approved
      await this.prisma.agentAction.update({
        where: { id: proposalId },
        data: { metadata: { ...metadata, status: 'APPROVED' } },
      });

      this.logger.log(
        `Strategic Proposal Executed: Merged ${sourceProjectId} into ${targetProjectId}`,
      );
    }

    return { success: true };
  }

  private async createProposal(
    workspaceId: string,
    data: {
      agentName: string;
      actionType: string;
      targetId: string;
      reason: string;
      metadata: Record<string, unknown>;
    },
  ) {
    // Check if a similar PENDING proposal already exists to avoid spam
    const existing = await this.prisma.agentAction.findFirst({
      where: {
        workspaceId,
        actionType: data.actionType,
        targetId: data.targetId,
      },
    });

    if (existing && (existing.metadata as { status: string })?.status !== 'APPROVED') {
      return existing;
    }

    return this.prisma.agentAction.create({
      data: {
        workspaceId,
        agentName: data.agentName,
        actionType: data.actionType,
        targetId: data.targetId,
        reason: data.reason,
        metadata: { ...data.metadata, status: 'PENDING' },
      },
    });
  }
}

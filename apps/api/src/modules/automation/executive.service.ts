import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SymbiosisService } from './symbiosis.service';
import { AiService } from '../ai/ai.service';

interface DirectiveMetadata {
  title: string;
  actions: { type: string; data?: { id: string }; reason: string }[];
  outcome: string;
  status: 'PENDING' | 'EXECUTED';
}

@Injectable()
export class ExecutiveService {
  private readonly logger = new Logger(ExecutiveService.name);

  constructor(
    private prisma: PrismaService,
    private symbiosisService: SymbiosisService,
    private forecastService: ForecastService,
    private aiService: AiService,
  ) {}

  /**
   * Synthesizes active strategic signals into a singular Global Directive.
   */
  async generateGlobalDirective(workspaceId: string) {
    this.logger.log(`Synthesizing Global Directive for workspace ${workspaceId}`);

    // 1. Gather all tactical context
    const [proposals, projects] = await Promise.all([
      this.symbiosisService.getPendingProposals(workspaceId),
      this.prisma.project.findMany({ where: { workspaceId, deletedAt: null } }),
    ]);

    // 2. Synthesize with AI
    const context = {
      pendingProposals: proposals.map((p) => ({ type: p.actionType, reason: p.reason })),
      activeProjects: projects.map((p) => p.name),
      timestamp: new Date().toISOString(),
    };

    const result = await this.aiService.processText(JSON.stringify(context), 'neural_executive');

    let directive;
    try {
      directive = JSON.parse(result);
    } catch {
      directive = {
        title: 'Strategic Realignment',
        reason: 'Workspace structural inefficiencies detected.',
        actions: proposals.map((p) => ({ type: p.actionType, data: { id: p.id } })),
        outcome: 'Increased operational coherence.',
      };
    }

    // 3. Store the directive (using AgentAction as a generic store for now)
    return this.prisma.agentAction.create({
      data: {
        workspaceId,
        agentName: 'NeuralExecutive',
        actionType: 'GLOBAL_DIRECTIVE',
        targetId: workspaceId,
        reason: directive.reason,
        metadata: {
          title: directive.title,
          actions: directive.actions,
          outcome: directive.outcome,
          status: 'PENDING',
        },
      },
    });
  }

  /**
   * Executes a chained directive.
   */
  async executeDirective(directiveId: string) {
    const directive = await this.prisma.agentAction.findUnique({
      where: { id: directiveId },
    });

    if (!directive || directive.actionType !== 'GLOBAL_DIRECTIVE') {
      throw new Error('Valid directive not found');
    }

    const metadata = directive.metadata as DirectiveMetadata;
    const actions = metadata.actions;

    this.logger.log(`Executing Global Directive: ${metadata.title}`);

    for (const action of actions) {
      if (action.type === 'MERGE_PROJECTS' && action.data?.id) {
        await this.symbiosisService.approveProposal(action.data.id);
      }
      // Future: Add REASSIGN_TASKS, UPDATE_DEADLINE, etc.
    }

    // Mark as approved
    return this.prisma.agentAction.update({
      where: { id: directiveId },
      data: { metadata: { ...metadata, status: 'EXECUTED' } },
    });
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { DocService } from '../doc/doc.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);

  constructor(
    private aiService: AiService,
    private docService: DocService,
    private prisma: PrismaService,
  ) {}

  async diagnose(error: Error, context: Record<string, unknown>) {
    const errorData = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      request: {
        method: context.method,
        url: context.url,
        body: context.body,
        params: context.params,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      const prompt = `System Error Detected:\n${JSON.stringify(errorData, null, 2)}\n\nAnalyze the root cause and suggest a code fix. Format as a technical troubleshooting guide.`;
      const diagnosis = await this.aiService.processText(prompt, 'diagnose_error');

      // Create a Troubleshooting Doc in the workspace knowledge base
      const workspaceId = (context.workspaceId as string) || 'system';
      const adminMember = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId, role: 'admin' },
        include: { user: true },
      });

      if (!adminMember) return;
      const systemUser = adminMember.user;

      const doc = await this.docService.createDoc(workspaceId, systemUser.id, {
        title: `🚨 AI Diagnosis: ${error.name} at ${context.url}`,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: diagnosis }] }],
        },
      });

      this.logger.log(`Created AI Diagnosis Doc: ${doc.id}`);
      return diagnosis;
    } catch (err) {
      this.logger.error('Failed to generate AI diagnosis', err);
      return null;
    }
  }

  async generatePlaywrightSpec(featureGoal: string) {
    const prompt = `Generate a modern Playwright e2e test (TypeScript) for this feature: "${featureGoal}". 
    Use POM (Page Object Model) where applicable. 
    Assume common routes like /login, /jira, /settings. 
    Output only the valid .spec.ts code.`;

    const code = await this.aiService.processText(prompt, 'generate_playwright_spec');
    return code;
  }

  async diagnoseKnowledgeSilos(workspaceId: string) {
    const [docs, tasks] = await Promise.all([
      this.prisma.doc.findMany({ where: { workspaceId, deletedAt: null } }),
      this.prisma.task.findMany({
        where: { deletedAt: null },
        include: { project: true },
      }),
    ]);

    const context = `
      Workspace Knowledge Nodes: ${docs.length}
      Strategic Tactical Tasks: ${tasks.length}
      Projects: ${Array.from(new Set(tasks.map((t) => t.project?.name))).join(', ')}

      Analyze for:
      - Information Silos: High-value knowledge restricted to one project.
      - Strategic Blind Spots: Tasks with no linked documentation.
      - Redundant Synthesis: Multiple documents covering the same mission area.
    `;

    const diagnosis = await this.aiService.processText(context, 'knowledge_silo_strategist');

    try {
      // Return structured diagnosis recommendations
      return {
        nodesAnalyzed: docs.length + tasks.length,
        diagnosis,
        recommendations: [
          'Identify cross-project bridges for shared technical protocols',
          'Consolidate redundant mission diaries into a single Source of Truth',
          'Automate linking for Orphaned Intelligence nodes',
        ],
      };
    } catch {
      return {
        diagnosis:
          'Intelligence synthesis complete. Recommendation: Consolidate mission protocols.',
      };
    }
  }

  async detectStrategicDivergence(workspaceId: string) {
    const [docs, tasks] = await Promise.all([
      this.prisma.doc.findMany({
        where: { workspaceId, deletedAt: null },
        include: { project: true },
      }),
      this.prisma.task.findMany({
        where: { project: { workspaceId }, deletedAt: null },
        include: { project: true, docLinks: true },
      }),
    ]);

    interface StrategicNode {
      id: string;
      type: string;
      title: string;
      projectId: string | null;
      projectName: string;
      hasLinks?: boolean;
    }

    const nodes: StrategicNode[] = [
      ...docs.map((d) => ({
        id: d.id,
        type: 'doc',
        title: d.title,
        projectId: d.projectId,
        projectName: d.project?.name || 'Workspace Core',
      })),
      ...tasks.map((t) => ({
        id: t.id,
        type: 'task',
        title: t.title,
        projectId: t.projectId,
        projectName: (t as { project?: { name: string } }).project?.name || 'Unknown',
        hasLinks: (t as { docLinks: unknown[] }).docLinks.length > 0,
      })),
    ];

    interface StrategicCollision {
      id: string;
      nodes: StrategicNode[];
      sourceTaskId: string;
      targetTaskId: string;
      type: string;
      intensity: number;
      category: string;
      protocol?: string;
    }

    const collisions: StrategicCollision[] = [];

    // Analyze Similarity across Projects
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i]!;
        const nodeB = nodes[j]!;

        if (!nodeA.projectId || !nodeB.projectId || nodeA.projectId === nodeB.projectId) continue;

        const similarity = this.calculateHeuristicSimilarity(nodeA.title, nodeB.title);

        if (similarity > 0.8) {
          collisions.push({
            id: `collision-${nodeA.id}-${nodeB.id}`,
            nodes: [nodeA, nodeB],
            sourceTaskId: nodeA.id,
            targetTaskId: nodeB.id,
            type: 'relates_to',
            intensity: similarity,
            category: 'semantic_collision',
          });
        }
      }
    }

    const results: StrategicCollision[] = [];
    for (const collision of collisions.slice(0, 5)) {
      const prompt = `Strategic Collision Detected:
        Node A: [${collision.nodes[0]!.type}] ${collision.nodes[0]!.title} in Project "${collision.nodes[0]!.projectName}"
        Node B: [${collision.nodes[1]!.type}] ${collision.nodes[1]!.title} in Project "${collision.nodes[1]!.projectName}"
        
        Suggest a resolution protocol to align these efforts. Provide a 1-sentence tactical directive.`;

      const protocol = await this.aiService.processText(prompt, 'mission_alignment_auditor');
      results.push({ ...collision, protocol });
    }

    return results;
  }

  private calculateHeuristicSimilarity(a: string, b: string): number {
    const wordsA = new Set(
      a
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 2),
    );
    const wordsB = new Set(
      b
        .toLowerCase()
        .split(' ')
        .filter((w) => w.length > 2),
    );
    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
    const stopWords = new Set([
      'the',
      'and',
      'for',
      'with',
      'system',
      'implement',
      'build',
      'layer',
      'core',
    ]);
    const meaningfulWords = Array.from(intersection).filter((w) => !stopWords.has(w));

    if (meaningfulWords.length >= 2) return 0.9;
    if (meaningfulWords.length >= 1) return 0.7;
    return 0;
  }
}

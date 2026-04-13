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
      // Use the workspaceId from context if available, otherwise fallback to system workspace
      const workspaceId = context.workspaceId || 'system';
      const systemUser = await this.prisma.user.findFirst({ where: { role: 'admin' } });

      if (!systemUser) return;

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
        where: { projectId: { not: null }, deletedAt: null },
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
}

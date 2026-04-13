import { Injectable } from '@nestjs/common';
import { ChronologyService } from './chronology.service';
import { ReportService } from './report.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommandService {
  constructor(
    private chronologyService: ChronologyService,
    private reportService: ReportService,
    private diagnosisService: DiagnosisService,
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  async getMissionBriefing(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, workspaceId: true },
    });

    if (!project) return null;

    const [pulses, report, collisions] = await Promise.all([
      this.chronologyService.getProjectTimeline(projectId),
      this.reportService.getProjectReport(projectId),
      this.diagnosisService.detectStrategicDivergence(project.workspaceId),
    ]);

    // Focus on recent context
    const recentActivity = pulses
      .slice(0, 3)
      .map((p) => `- ${p.date}: ${p.narrative}`)
      .join('\n');

    const relevantCollisions = (
      collisions as Array<{ nodes: Array<{ projectName: string }>; protocol: string }>
    )
      .filter((c) => c.nodes.some((n) => n.projectName === project.name))
      .map((c) => `- ${c.protocol}`)
      .join('\n');

    const health = `Velocity: ${report.velocity[report.velocity.length - 1]?.points || 0}. Status: ${report.distribution.map((d: { status: string; count: number }) => `${d.status}: ${d.count}`).join(', ')}`;

    const context = `
      Mission: ${project.name}
      
      Recent Activity Pulses:
      ${recentActivity}
      
      Strategic Divergence Alerts:
      ${relevantCollisions || 'None detected.'}
      
      Intelligence Metrics:
      ${health}
    `;

    const sitrep = await this.aiService.processText(context, 'commander_briefing');

    return {
      missionName: project.name,
      sitrep,
      metrics: {
        velocity: report.velocity[report.velocity.length - 1]?.points || 0,
        collisions: collisions.length,
        pulses: pulses.length,
      },
      latestIntensity: pulses[0]?.intensity || 0,
    };
  }
}

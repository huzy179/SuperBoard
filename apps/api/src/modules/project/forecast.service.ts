import { Injectable } from '@nestjs/common';
import { ReportService } from './report.service';
import { ChronologyService } from './chronology.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ForecastService {
  constructor(
    private reportService: ReportService,
    private chronologyService: ChronologyService,
    private diagnosisService: DiagnosisService,
    private aiService: AiService,
    private prisma: PrismaService,
  ) {}

  async getMissionForecast(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, workspaceId: true },
    });

    if (!project) return null;

    const [report, pulses, collisions] = await Promise.all([
      this.reportService.getProjectReport(projectId),
      this.chronologyService.getProjectTimeline(projectId),
      this.diagnosisService.detectStrategicDivergence(project.workspaceId),
    ]);

    // 1. Completion Trajectory
    const remainingPoints = report.metrics.totalStoryPoints - report.metrics.completedStoryPoints;
    const avgVelocity =
      report.velocity.reduce((sum, v) => sum + v.points, 0) / report.velocity.length || 1;
    const daysToCompletion = Math.ceil(remainingPoints / (avgVelocity / 30)); // Rough estimate in days

    // 2. Architectural Drift
    const drifters = (
      collisions as { intensity: number; nodes: { projectName: string }[] }[]
    ).filter((c) => c.intensity > 0.7 && c.nodes.some((n) => n.projectName === project.name));
    const driftIntensity = drifters.length / 10; // Normalized drift (max 1.0)

    // 3. Chronology Stability
    const pulsesLast7Days = pulses.filter((p) => {
      const date = new Date(p.date);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return date > sevenDaysAgo;
    });
    const heartbeatStability = pulsesLast7Days.length / 5; // Target 5 pulses a week

    const context = `
      Project: ${project.name}
      Current Velocity (Monthly): ${avgVelocity}
      Remaining Points: ${remainingPoints}
      Estimated Days to Completion: ${daysToCompletion}
      Architectural Drift Intensity: ${driftIntensity.toFixed(2)}
      Timeline Pulse Stability: ${heartbeatStability.toFixed(2)}
      Active Strategic Collisions: ${drifters.length}
    `;

    const forecastNarrative = await this.aiService.processText(context, 'strategic_oracle');

    return {
      prediction: forecastNarrative,
      confidence: Math.max(0.1, Math.min(0.95, heartbeatStability * (1 - driftIntensity))),
      metrics: {
        completionDays: daysToCompletion,
        driftIndex: driftIntensity,
        stability: heartbeatStability,
      },
      trajectory:
        daysToCompletion < 30 ? 'POSITIVE' : daysToCompletion < 90 ? 'NEUTRAL' : 'CRITICAL',
    };
  }
}

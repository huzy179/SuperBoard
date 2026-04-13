import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { ReportService } from '../project/report.service';

@Injectable()
export class TalentService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private reportService: ReportService,
  ) {}

  async syncUserSkills(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: { status: 'done' },
          orderBy: { updatedAt: 'desc' },
          take: 30,
          select: { title: true, description: true },
        },
      },
    });

    if (!user) throw new BadRequestException('User not found');

    const taskContext = user.assignedTasks
      .map((t) => `${t.title}: ${t.description || ''}`)
      .join('\n');

    // Use AI to extract skill tokens
    const skillsJson = await this.aiService.processText(
      `Historical Tasks:\n${taskContext}\n\nExtract key technical skills and expertise as a JSON object with 'technical', 'soft', and 'velocity' (0-1) fields.`,
      'extract_skills',
    );

    try {
      const parsed = JSON.parse(skillsJson);
      await this.prisma.user.update({
        where: { id: userId },
        data: { aiSkillProfile: parsed },
      });
      return parsed;
    } catch {
      return null;
    }
  }

  async suggestAssignees(taskId: string, workspaceId: string) {
    const [task, workspaceMembers] = await Promise.all([
      this.prisma.task.findUnique({
        where: { id: taskId },
        select: { title: true, description: true, storyPoints: true, projectId: true },
      }),
      this.prisma.workspaceMember.findMany({
        where: { workspaceId, deletedAt: null },
        include: {
          user: {
            select: { id: true, fullName: true, aiSkillProfile: true },
          },
        },
      }),
    ]);

    if (!task) throw new BadRequestException('Task not found');

    // Get current workload for the project (as a proxy for availability)
    const report = await this.reportService.getProjectReport(task.projectId);
    const workloadMap = new Map(report.workload.map((w) => [w.assigneeId, w.count]));

    const users = workspaceMembers.map((m) => m.user);
    const suggestions = users
      .map((user) => {
        const skills = (user.aiSkillProfile as Record<string, unknown>) || { technical: [] };
        const workload = workloadMap.get(user.id) || 0;
        const technicalSkills = (skills['technical'] as string[]) || [];

        // Basic heuristic: check if task title overlaps with skill tokens
        const skillMatch = technicalSkills.filter(
          (s: string) =>
            task.title.toLowerCase().includes(s.toLowerCase()) ||
            task.description?.toLowerCase().includes(s.toLowerCase()),
        ).length;

        // Score: (Skill Match * 10) - (Workload * 2)
        const score = skillMatch * 10 - workload * 2;

        return {
          id: user.id,
          fullName: user.fullName,
          score,
          workload,
          skills: skills.technical,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return suggestions;
  }
}

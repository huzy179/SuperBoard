import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportService } from '../project/report.service';
import { DocService } from '../doc/doc.service';
import { AiService } from '../ai/ai.service';
import { format, startOfWeek } from 'date-fns';

@Injectable()
export class DiaryService {
  constructor(
    private prisma: PrismaService,
    private reportService: ReportService,
    private docService: DocService,
    private aiService: AiService,
  ) {}

  async generateWeeklyDiary(projectId: string, authorId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true, workspaceId: true },
    });

    if (!project) return;

    const report = await this.reportService.getProjectReport(projectId);
    const weeklyStart = startOfWeek(new Date());
    const title = `Dev Diary: ${project.name} - Week of ${format(weeklyStart, 'MMM dd, yyyy')}`;

    const context = `Project: ${project.name}\nStats: ${JSON.stringify(report.distribution)}\nRecent Activity: ${JSON.stringify(report.burndown.slice(-7))}`;

    // Use AI to generate a professional developer diary content
    const summary = await this.aiService.processText(
      `Generate a comprehensive and professional "Dev Diary" entry based on this data:\n${context}\n\nInclude:\n- Key Accomplishments\n- Resolved Blockers\n- Technical Progression\n- Focus for Next Week.`,
      'dev_diary',
    );

    // Create the Doc
    const doc = await this.docService.createDoc(project.workspaceId, authorId, {
      title,
      content: {
        type: 'doc',
        content: [{ type: 'paragraph', content: [{ type: 'text', text: summary }] }],
      },
    });

    // Update the doc with projectId
    await this.prisma.doc.update({
      where: { id: doc.id },
      data: { projectId },
    });

    return doc;
  }
}

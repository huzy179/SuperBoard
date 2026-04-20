import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { DocService } from '../doc/doc.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BriefingService {
  constructor(
    private aiService: AiService,
    private docService: DocService,
    private prisma: PrismaService,
  ) {}

  async generateMissionBriefing(projectId: string, goal: string, tasks: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const taskSummary = (tasks as any[]).map((t) => `- ${t.title}: ${t.description}`).join('\n');

    const prompt = `
      Hãy soạn một bản "Mission Briefing" chuyên nghiệp cho dự án sau.
      Mục tiêu chiến lược: ${goal}
      Các nhiệm vụ then chốt:
      ${taskSummary}
      
      Yêu cầu:
      1. Viết dưới dạng một tài liệu chiến lược súc tích.
      2. Bao gồm các phần: Tầm nhìn, Lộ trình thực hiện, và Các điểm cần lưu ý.
      3. Định dạng kết quả trả về là JSON phù hợp với cấu trúc TipTap (Prosemirror).
      4. Ngôn ngữ: Tiếng Việt.
    `;

    const briefingJson = await this.aiService.processText(prompt, 'generate_briefing');

    // Parse the JSON (AI might return it as a string)
    let content = {};
    try {
      content = JSON.parse(briefingJson);
    } catch {
      // Fallback to a simple structure if AI fails to return valid JSON
      content = {
        type: 'doc',
        content: [
          {
            type: 'heading',
            attrs: { level: 1 },
            content: [{ type: 'text', text: `Mission Briefing: ${goal}` }],
          },
          { type: 'paragraph', content: [{ type: 'text', text: briefingJson }] },
        ],
      };
    }

    // Create the document
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { workspaceId: true },
    });

    if (!project) return null;

    const doc = await this.docService.createDoc(project.workspaceId, 'ai-system-agent', {
      title: `Mission Briefing: ${goal.slice(0, 50)}...`,
      content,
    });

    // Link doc to project
    await this.prisma.doc.update({
      where: { id: doc.id },
      data: { projectId },
    });

    return doc;
  }
}

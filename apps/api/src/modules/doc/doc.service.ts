import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { logger } from '../../common/logger';

@Injectable()
export class DocService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async createDoc(
    workspaceId: string,
    authorId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { title: string; content?: any; parentDocId?: string },
  ) {
    const doc = await this.prisma.doc.create({
      data: {
        workspaceId,
        createdById: authorId,
        title: data.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: (data.content as any) ?? null,
        parentDocId: data.parentDocId ?? null,
      },
    });

    // Trigger embedding sync in background
    void this.syncDocEmbedding(doc.id, doc.title, doc.content);

    return doc;
  }

  async getWorkspaceDocs(workspaceId: string) {
    const docSelect = {
      id: true,
      title: true,
      parentDocId: true,
      createdById: true,
      lastEditedBy: true,
      createdAt: true,
      updatedAt: true,
      workspaceId: true,
      summary: true,
    } as const;

    return this.prisma.doc.findMany({
      where: { workspaceId, parentDocId: null },
      select: {
        ...docSelect,
        children: {
          where: {},
          select: {
            ...docSelect,
            children: {
              where: {},
              select: docSelect,
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getDocById(docId: string) {
    const doc = await this.prisma.doc.findUnique({
      where: { id: docId },
      include: {
        creator: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        children: {
          where: {},
        },
      },
    });
    if (!doc || doc.deletedAt) throw new NotFoundException('Document not found');
    return doc;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateDoc(docId: string, data: { title?: string; content?: any; parentDocId?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.parentDocId !== undefined) updateData.parentDocId = data.parentDocId;

    const doc = await this.prisma.doc.update({
      where: { id: docId },
      data: updateData,
    });

    // Trigger embedding sync in background if title or content changed
    if (data.title !== undefined || data.content !== undefined) {
      void this.syncDocEmbedding(doc.id, doc.title, doc.content);
    }

    return doc;
  }

  async deleteDoc(docId: string) {
    return this.prisma.doc.update({
      where: { id: docId },
      data: { deletedAt: new Date() },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVersion(docId: string, content: any) {
    return this.prisma.docVersion.create({
      data: {
        docId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: content as any,
      },
    });
  }

  async getDocVersions(docId: string) {
    return this.prisma.docVersion.findMany({
      where: { docId },
      orderBy: { savedAt: 'desc' },
      take: 20,
    });
  }

  async getDocTextContent(docId: string): Promise<string> {
    const doc = await this.getDocById(docId);
    if (!doc.content) return '';

    return this.extractTextFromJSON(doc.content);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractTextFromJSON(node: any): string {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (Array.isArray(node.content)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return node.content.map((child: any) => this.extractTextFromJSON(child)).join(' ');
    }
    if (node.content) {
      return this.extractTextFromJSON(node.content);
    }
    return '';
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async syncDocEmbedding(docId: string, title: string, content: any) {
    try {
      const textContent = content ? this.extractTextFromJSON(content) : '';
      const text = `${title}\n${textContent}`.slice(0, 3000); // Limit to 3000 chars for quality
      const embedding = await this.aiService.getEmbedding(text);
      const vectorStr = `[${embedding.join(',')}]`;

      await this.prisma.$executeRaw`
        INSERT INTO "DocEmbedding" ("docId", "vector", "updatedAt")
        VALUES (${docId}, ${vectorStr}::vector, NOW())
        ON CONFLICT ("docId") 
        DO UPDATE SET "vector" = ${vectorStr}::vector, "updatedAt" = NOW();
      `;

      // NEW: Generate and persist AI Summary
      const summary = await this.aiService.processText(text, 'summarize');
      await this.prisma.doc.update({
        where: { id: docId },
        data: { summary },
      });
    } catch (err: unknown) {
      logger.error({ err, docId }, 'Failed to sync doc embedding');
    }
  }

  async proposeTaskLabels(docId: string, taskId: string) {
    const [doc, task] = await Promise.all([
      this.prisma.doc.findUnique({ where: { id: docId }, select: { summary: true, title: true } }),
      this.prisma.task.findUnique({
        where: { id: taskId },
        include: { project: { select: { workspaceId: true } } },
      }),
    ]);

    if (!doc || !task) return [];

    const workspaceId = task.project.workspaceId;
    const existingLabels = await this.prisma.label.findMany({
      where: { workspaceId },
      select: { id: true, name: true },
    });

    const context = `Document Title: ${doc.title}\nDocument Summary: ${doc.summary}`;
    const suggested = await this.aiService.suggestLabels(task.title, context, existingLabels);

    return suggested;
  }
}

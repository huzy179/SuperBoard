import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DocService {
  constructor(private prisma: PrismaService) {}

  async createDoc(
    workspaceId: string,
    authorId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { title: string; content?: any; parentDocId?: string },
  ) {
    return this.prisma.doc.create({
      data: {
        workspaceId,
        createdById: authorId,
        title: data.title,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: (data.content as any) ?? null,
        parentDocId: data.parentDocId ?? null,
      },
    });
  }

  async getWorkspaceDocs(workspaceId: string) {
    return this.prisma.doc.findMany({
      where: { workspaceId, parentDocId: null, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          include: {
            children: true,
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
          where: { deletedAt: null },
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

    return this.prisma.doc.update({
      where: { id: docId },
      data: updateData,
    });
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
}

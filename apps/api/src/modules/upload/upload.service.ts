import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProjectTaskAttachmentDTO } from '@superboard/shared';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Uploads a file to a task.
   * Currently mocks the storage portion but saves a real database record.
   */
  async uploadTaskAttachment(
    taskId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<ProjectTaskAttachmentDTO> {
    // 1. Verify task existence
    const task = await this.prisma.task.findUnique({
      where: { id: taskId, deletedAt: null },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Generate a mock key and URL
    const fileKey = `tasks/${taskId}/${Date.now()}-${file.originalname}`;
    const mockUrl = `https://mock-storage.superboard.dev/${fileKey}`;

    // 3. Save to database
    const attachment = await this.prisma.attachment.create({
      data: {
        name: file.originalname,
        key: fileKey,
        url: mockUrl,
        size: BigInt(file.size),
        mimeType: file.mimetype,
        taskId: taskId,
      },
    });

    return {
      id: attachment.id,
      name: attachment.name,
      key: attachment.key,
      url: attachment.url,
      size: Number(attachment.size),
      mimeType: attachment.mimeType,
      createdAt: attachment.createdAt.toISOString(),
    };
  }

  /**
   * Deletes an attachment.
   */
  async deleteAttachment(id: string): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    // Mark as deleted in DB (Soft delete)
    await this.prisma.attachment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

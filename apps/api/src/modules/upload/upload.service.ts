import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import type { ProjectTaskAttachmentDTO } from '@superboard/shared';
import { join, extname } from 'path';
import { mkdir, writeFile } from 'fs/promises';

@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  /**
   * Uploads a file to a task.
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
      where: { id: taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // 2. Generate a mock key and URL
    const fileKey = `tasks/${taskId}/${Date.now()}-${file.originalname}`;
    const mockUrl = `https://mock-storage.superboard.dev/${fileKey}`;

    // 3. AI Analysis (Async Trigger)
    let aiContext: string | undefined;
    try {
      // In this version, we process synchronously for simplicity, but in prod this is a worker
      aiContext = await this.aiService.analyzeMedia(mockUrl, file.mimetype);
    } catch (err) {
      console.error('AI Analysis failed during upload:', err);
    }

    // 4. Save to database
    const attachment = await this.prisma.attachment.create({
      data: {
        name: file.originalname,
        key: fileKey,
        url: mockUrl,
        size: BigInt(file.size),
        mimeType: file.mimetype,
        taskId: taskId,
        aiContext: aiContext || null,
        aiMetadata: (aiContext
          ? { processedAt: new Date().toISOString() }
          : null) as unknown as object,
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
      aiContext: attachment.aiContext || '',
    };
  }

  async uploadAvatar(
    userId: string,
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
  ): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads', 'avatars');
    await mkdir(uploadDir, { recursive: true });

    const fileName = `${userId}-${Date.now()}${extname(file.originalname)}`;
    const filePath = join(uploadDir, fileName);

    await writeFile(filePath, file.buffer);

    // This relative URL will be served by ServeStaticModule
    return `/uploads/avatars/${fileName}`;
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

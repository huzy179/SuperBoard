import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { SendMessageDto, UpdateMessageDto, AddReactionDto } from './dto/chat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getChannels(workspaceId: string, userId: string) {
    return this.prisma.channel.findMany({
      where: {
        workspaceId,
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
      },
    });
  }

  async getMessages(channelId: string, cursor?: string, limit = 50) {
    const query: Prisma.MessageFindManyArgs = {
      where: {
        channelId,
        parentId: null,
      },
      take: limit,
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        reactions: true,
        _count: {
          select: { replies: true },
        },
      },
    };

    if (cursor) {
      query.cursor = { id: cursor };
    }

    const messages = await this.prisma.message.findMany(query);

    const lastMessage = messages[messages.length - 1];
    const nextCursor = messages.length === limit ? lastMessage?.id : null;

    return {
      items: messages,
      nextCursor,
    };
  }

  async getMessage(messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        reactions: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    if (!message) throw new NotFoundException('Message not found');
    return message;
  }

  async getThreadMessages(messageId: string) {
    return this.prisma.message.findMany({
      where: {
        parentId: messageId,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        reactions: true,
      },
    });
  }

  async createMessage(channelId: string, userId: string, dto: SendMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        content: dto.content,
        channelId,
        authorId: userId,
        parentId: dto.parentId ?? null,
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        reactions: true,
        _count: {
          select: { replies: true },
        },
      },
    });

    // Emit Neural Signal for telemetry
    void this.aiService.logSignal(
      'CHAT_MESSAGE_SENT',
      {
        messageId: message.id,
        channelId: message.channelId,
        content: message.content,
        authorId: message.authorId,
      },
      {
        channelId: message.channelId,
      },
    );

    // Proactive Intelligence: Detect Strategic Intent
    this.detectAndPropose(channelId, message.content);

    return message;
  }

  private async detectAndPropose(channelId: string, content: string) {
    const triggerKeywords = ['architect', 'tổng hợp', 'kế hoạch', 'project', 'dự án', 'mission'];
    const hasTrigger = triggerKeywords.some((kw) => content.toLowerCase().includes(kw));

    if (hasTrigger) {
      // Run a lightweight intent check via AI
      const intentResult = await this.aiService.processText(content, 'intent_detection');
      if (intentResult.includes('ACTION_PROPOSAL_REQUIRED')) {
        // Suggest running the Mission Architect
        await this.prisma.message.create({
          data: {
            content: `[NEURAL PROPOSAL] Tôi nhận thấy bạn đang thảo luận về một mục tiêu chiến lược. Bạn có muốn tôi sử dụng "Mission Architect" để bóc tách kế hoạch này không?`,
            channelId,
            authorId: 'ai-system-agent', // Dedicated system ID
          },
        });
        // We'd also emit this via Gateway in a real scenario, or just rely on the next pull/socket event
      }
    }
  }

  async updateMessage(messageId: string, userId: string, dto: UpdateMessageDto) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== userId) throw new ForbiddenException('Not allowed');

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        editedAt: new Date(),
      },
      include: {
        author: {
          select: { id: true, fullName: true, avatarUrl: true },
        },
        reactions: true,
        _count: {
          select: { replies: true },
        },
      },
    });
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.authorId !== userId) throw new ForbiddenException('Not allowed');

    return this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  mapMessageToDTO(message: Record<string, unknown>): Record<string, unknown> {
    return {
      ...message,
      createdAt:
        message.createdAt instanceof Date ? message.createdAt.toISOString() : message.createdAt,
      updatedAt:
        message.updatedAt instanceof Date ? message.updatedAt.toISOString() : message.updatedAt,
      editedAt:
        message.editedAt instanceof Date ? message.editedAt.toISOString() : message.editedAt,
      deletedAt:
        message.deletedAt instanceof Date ? message.deletedAt.toISOString() : message.deletedAt,
    };
  }

  async addReaction(messageId: string, userId: string, dto: AddReactionDto) {
    const existing = await this.prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji: dto.emoji,
        },
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await this.prisma.messageReaction.create({
        data: { messageId, userId, emoji: dto.emoji },
      });
    }
  }

  async joinChannel(channelId: string, userId: string) {
    return this.prisma.channelMember.upsert({
      where: {
        channelId_userId: { channelId, userId },
      },
      update: {},
      create: {
        channelId,
        userId,
      },
    });
  }
}

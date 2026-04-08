import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto, UpdateMessageDto, AddReactionDto } from './dto/chat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
    return this.prisma.message.create({
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

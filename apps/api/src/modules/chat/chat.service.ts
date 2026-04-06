import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ChannelType } from '@superboard/shared';
import { ChatGateway } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private chatGateway: ChatGateway,
  ) {}

  async createChannel(
    workspaceId: string,
    data: { name: string; description?: string; type: ChannelType },
  ) {
    return this.prisma.channel.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description ?? null,
        type: data.type,
      },
    });
  }

  async getWorkspaceChannels(workspaceId: string) {
    return this.prisma.channel.findMany({
      where: { workspaceId },
      orderBy: { name: 'asc' },
    });
  }

  async getChannelById(channelId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
    });
    if (!channel) throw new NotFoundException('Channel not found');
    return channel;
  }

  async joinChannel(channelId: string, userId: string) {
    return this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      update: {},
      create: { channelId, userId },
    });
  }

  async sendMessage(channelId: string, authorId: string, content: string, parentId?: string) {
    const message = await this.prisma.message.create({
      data: {
        channelId,
        authorId,
        content,
        parentId: parentId ?? null,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    this.chatGateway.emitMessageSent({
      ...message,
      createdAt: message.createdAt.toISOString(),
      updatedAt: message.updatedAt.toISOString(),
      editedAt: message.editedAt?.toISOString() ?? null,
      deletedAt: message.deletedAt?.toISOString() ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any); // Type cast since author info is extra
    return message;
  }

  async getChannelMessages(channelId: string, cursor?: string, limit = 50) {
    const messages = await this.prisma.message.findMany({
      where: { channelId },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor } } : {}),
      skip: cursor ? 1 : 0,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    const hasNextPage = messages.length > limit;
    const items = hasNextPage ? messages.slice(0, -1) : messages;
    const lastItem = items[items.length - 1];
    const nextCursor = hasNextPage && lastItem ? lastItem.id : null;

    return {
      items,
      nextCursor,
    };
  }
}

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import {
  SendMessageDto,
  UpdateMessageDto,
  AddReactionDto,
  CreateChannelDto,
  UpdateChannelDto,
} from './dto/chat.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getChannels(workspaceId: string, userId: string) {
    const channels = await this.prisma.channel.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        members: {
          some: { userId },
        },
      },
      include: {
        _count: {
          select: { members: true },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        },
      },
    });

    return channels.map((c) => this.mapChannelToDTO(c));
  }

  async createChannel(workspaceId: string, userId: string, dto: CreateChannelDto) {
    const memberIds = Array.from(new Set([userId, ...(dto.memberIds || [])]));

    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        userId: { in: memberIds },
      },
      select: { userId: true },
    });
    const allowed = new Set(workspaceMembers.map((m) => m.userId));
    if (memberIds.some((id) => !allowed.has(id))) {
      throw new ForbiddenException('Invalid channel members');
    }

    const channel = await this.prisma.channel.create({
      data: {
        workspaceId,
        name: dto.name,
        description: dto.description ?? null,
        type: dto.type === 'PRIVATE' ? 'private' : 'public',
        members: {
          createMany: {
            data: memberIds.map((id) => ({ userId: id })),
            skipDuplicates: true,
          },
        },
      },
    });

    return this.mapChannelToDTO(channel);
  }

  async getOrCreateDm(workspaceId: string, userId: string, otherUserId: string) {
    const ids = [userId, otherUserId].sort();
    const dmName = `dm:${ids[0]}:${ids[1]}`;

    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        userId: { in: [userId, otherUserId] },
      },
      select: { userId: true },
    });
    if (workspaceMembers.length !== 2) throw new ForbiddenException('Invalid DM members');

    const channel = await this.prisma.channel.upsert({
      where: { workspaceId_name: { workspaceId, name: dmName } },
      update: {},
      create: {
        workspaceId,
        name: dmName,
        description: null,
        type: 'private',
        members: {
          createMany: {
            data: [{ userId }, { userId: otherUserId }],
            skipDuplicates: true,
          },
        },
      },
    });

    return this.mapChannelToDTO(channel);
  }

  async findDm(workspaceId: string, userId: string, otherUserId: string) {
    const ids = [userId, otherUserId].sort();
    const dmName = `dm:${ids[0]}:${ids[1]}`;

    // Validate both users belong to workspace
    const workspaceMembers = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        userId: { in: [userId, otherUserId] },
      },
      select: { userId: true },
    });
    if (workspaceMembers.length !== 2) throw new ForbiddenException('Invalid DM members');

    const channel = await this.prisma.channel.findUnique({
      where: { workspaceId_name: { workspaceId, name: dmName } },
    });

    return channel ? this.mapChannelToDTO(channel) : null;
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

  async getChannelMembers(channelId: string, userId: string) {
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Not allowed');

    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      select: {
        userId: true,
        joinedAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'asc',
      },
    });

    return members.map((m) => ({
      id: `${channelId}:${m.userId}`,
      userId: m.userId,
      fullName: m.user.fullName,
      email: m.user.email,
      avatarColor: null,
      role: 'member',
      joinedAt: m.joinedAt instanceof Date ? m.joinedAt.toISOString() : new Date().toISOString(),
    }));
  }

  async addChannelMember(channelId: string, actorUserId: string, newUserId: string) {
    const actorMembership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: actorUserId } },
      select: { id: true },
    });
    if (!actorMembership) throw new ForbiddenException('Not allowed');

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, workspaceId: true, deletedAt: true, name: true },
    });
    if (!channel || channel.deletedAt) throw new NotFoundException('Channel not found');

    if (channel.name.startsWith('dm:')) {
      throw new BadRequestException('Cannot modify DM members');
    }

    const workspaceMember = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: channel.workspaceId, userId: newUserId } },
      select: { id: true, deletedAt: true },
    });
    if (!workspaceMember || workspaceMember.deletedAt) {
      throw new BadRequestException('User is not in workspace');
    }

    await this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId: newUserId } },
      update: {},
      create: { channelId, userId: newUserId },
    });

    return { added: true };
  }

  async updateChannel(channelId: string, userId: string, dto: UpdateChannelDto) {
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Not allowed');

    const existing = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, name: true, workspaceId: true, type: true, deletedAt: true },
    });
    if (!existing || existing.deletedAt) throw new NotFoundException('Channel not found');
    if (existing.name.startsWith('dm:')) throw new BadRequestException('Cannot rename DM channel');

    try {
      const updated = await this.prisma.channel.update({
        where: { id: channelId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
      return this.mapChannelToDTO(updated);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('Channel name already exists');
      }
      throw err;
    }
  }

  async leaveChannel(channelId: string, userId: string) {
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    });
    if (!membership) throw new ForbiddenException('Not allowed');

    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { id: true, name: true, deletedAt: true },
    });
    if (!channel || channel.deletedAt) throw new NotFoundException('Channel not found');

    if (channel.name.startsWith('dm:')) {
      throw new BadRequestException('Cannot leave DM channel');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.channelMember.delete({
        where: { channelId_userId: { channelId, userId } },
      });

      const remaining = await tx.channelMember.count({ where: { channelId } });
      if (remaining === 0) {
        await tx.channel.update({
          where: { id: channelId },
          data: { deletedAt: new Date() },
        });
      }
    });

    return { left: true };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapChannelToDTO(channel: any) {
    const lastMessageAt = channel.messages?.[0]?.createdAt;
    return {
      ...channel,
      type: channel.type === 'private' ? 'PRIVATE' : 'PUBLIC',
      lastMessageAt:
        lastMessageAt instanceof Date ? lastMessageAt.toISOString() : (lastMessageAt ?? null),
      createdAt:
        channel.createdAt instanceof Date ? channel.createdAt.toISOString() : channel.createdAt,
      updatedAt:
        channel.updatedAt instanceof Date ? channel.updatedAt.toISOString() : channel.updatedAt,
      deletedAt:
        channel.deletedAt instanceof Date ? channel.deletedAt.toISOString() : channel.deletedAt,
    };
  }
}

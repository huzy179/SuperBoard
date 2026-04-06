import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreateAuditLogDto {
  workspaceId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(dto: CreateAuditLogDto) {
    return this.prisma.auditLog.create({
      data: {
        workspaceId: dto.workspaceId,
        actorId: dto.actorId ?? null,
        action: dto.action,
        entityType: dto.entityType,
        entityId: dto.entityId,
        payload: (dto.payload as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        ipAddress: dto.ipAddress ?? null,
        userAgent: dto.userAgent ?? null,
      },
    });
  }

  async getLogsByWorkspace(input: { workspaceId: string; cursor?: string; limit?: number }) {
    const limit = input.limit ?? 50;

    return this.prisma.auditLog.findMany({
      where: { workspaceId: input.workspaceId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
      include: {
        actor: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
            avatarColor: true,
          },
        },
      },
    });
  }
}

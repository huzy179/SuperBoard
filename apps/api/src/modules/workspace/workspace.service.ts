import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type WorkspaceItemDTO = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  async getWorkspacesByUser(
    userId: string,
    options?: { showArchived?: boolean },
  ): Promise<WorkspaceItemDTO[]> {
    const where: Prisma.WorkspaceWhereInput = {
      deletedAt: null,
      members: {
        some: {
          userId,
          deletedAt: null,
        },
      },
      ...(options?.showArchived ? {} : { isArchived: false }),
    };

    const workspaces = await this.prisma.workspace.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return workspaces.map((workspace) => this.toWorkspaceItemDTO(workspace));
  }

  async getWorkspaceByIdForUser(
    input: { workspaceId: string; userId: string },
    options?: { showArchived?: boolean },
  ): Promise<WorkspaceItemDTO | null> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        deletedAt: null,
        ...(options?.showArchived ? {} : { isArchived: false }),
        members: {
          some: {
            userId: input.userId,
            deletedAt: null,
          },
        },
      } as Prisma.WorkspaceWhereInput,
      select: {
        id: true,
        name: true,
        slug: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return workspace ? this.toWorkspaceItemDTO(workspace) : null;
  }

  async createWorkspaceForUser(input: {
    userId: string;
    name: string;
    slug?: string;
  }): Promise<WorkspaceItemDTO> {
    const normalizedName = input.name.trim();
    const slug = this.normalizeSlug(input.slug ?? normalizedName);

    const existingSlug = await this.prisma.workspace.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Workspace slug already exists');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: normalizedName,
          slug,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          isArchived: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: input.userId,
          role: 'owner',
        },
      });

      await tx.user.updateMany({
        where: {
          id: input.userId,
          deletedAt: null,
          defaultWorkspaceId: null,
        },
        data: {
          defaultWorkspaceId: workspace.id,
        },
      });

      return workspace;
    });

    return this.toWorkspaceItemDTO(result);
  }

  async updateWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    name?: string;
    slug?: string;
  }): Promise<WorkspaceItemDTO> {
    const existingWorkspace = await this.prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        deletedAt: null,
        members: {
          some: {
            userId: input.userId,
            deletedAt: null,
          },
        },
      } as Prisma.WorkspaceWhereInput,
      select: {
        id: true,
      },
    });

    if (!existingWorkspace) {
      throw new NotFoundException('Workspace not found');
    }

    const normalizedName = input.name?.trim();
    const normalizedSlug = input.slug ? this.normalizeSlug(input.slug) : undefined;

    if (normalizedSlug) {
      const duplicateSlug = await this.prisma.workspace.findFirst({
        where: {
          slug: normalizedSlug,
          id: {
            not: input.workspaceId,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateSlug) {
        throw new BadRequestException('Workspace slug already exists');
      }
    }

    const workspace = await this.prisma.workspace.update({
      where: {
        id: input.workspaceId,
      },
      data: {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(normalizedSlug !== undefined ? { slug: normalizedSlug } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return this.toWorkspaceItemDTO(workspace);
  }

  async archiveWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    archivedAt?: Date;
  }): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        deletedAt: null,
        isArchived: false,
        members: {
          some: {
            userId: input.userId,
            deletedAt: null,
          },
        },
      } as Prisma.WorkspaceWhereInput,
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.prisma.workspace.update({
      where: { id: input.workspaceId },
      data: {
        isArchived: true,
        deletedAt: input.archivedAt ?? new Date(),
      },
    });
  }

  async restoreWorkspaceForUser(input: {
    workspaceId: string;
    userId: string;
    restoredAt?: Date;
  }): Promise<void> {
    const workspace = await this.prisma.workspace.findFirst({
      where: {
        id: input.workspaceId,
        deletedAt: {
          not: null,
        },
        members: {
          some: {
            userId: input.userId,
            deletedAt: null,
          },
        },
      } as Prisma.WorkspaceWhereInput,
      select: {
        id: true,
      },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.prisma.workspace.update({
      where: { id: input.workspaceId },
      data: {
        isArchived: false,
        deletedAt: null,
      },
    });

    void input.restoredAt;
  }

  private normalizeSlug(input: string): string {
    const slug = input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      throw new BadRequestException('Workspace slug is required');
    }

    return slug;
  }

  private toWorkspaceItemDTO(workspace: {
    id: string;
    name: string;
    slug: string;
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): WorkspaceItemDTO {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      isArchived: workspace.isArchived,
      createdAt: workspace.createdAt.toISOString(),
      updatedAt: workspace.updatedAt.toISOString(),
    };
  }
}

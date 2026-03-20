import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type { AuthUserDTO, WorkspaceMemberItemDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { parseBooleanQuery } from '../../common/helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  @Get()
  async getWorkspaces(
    @CurrentUser() user: AuthUserDTO,
    @Query('showArchived') showArchived?: string,
  ) {
    const workspaces = await this.workspaceService.getWorkspacesByUser(user.id, {
      showArchived: parseBooleanQuery(showArchived),
    });

    return apiSuccess(workspaces);
  }

  @Get(':workspaceId')
  async getWorkspace(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
    @Query('showArchived') showArchived?: string,
  ) {
    const workspace = await this.workspaceService.getWorkspaceByIdForUser(
      { workspaceId, userId: user.id },
      {
        showArchived: parseBooleanQuery(showArchived),
      },
    );

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return apiSuccess(workspace);
  }

  @Post()
  async createWorkspace(
    @CurrentUser() user: AuthUserDTO,
    @Body() body: { name?: string; slug?: string },
  ) {
    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('Workspace name is required');
    }

    const workspace = await this.workspaceService.createWorkspaceForUser({
      userId: user.id,
      name,
      ...(body.slug ? { slug: body.slug } : {}),
    });

    return apiSuccess(workspace);
  }

  @Patch(':workspaceId')
  async updateWorkspace(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
    @Body() body: { name?: string; slug?: string },
  ) {
    const normalizedName = body.name?.trim();
    if (body.name !== undefined && !normalizedName) {
      throw new BadRequestException('Workspace name is required');
    }

    const workspace = await this.workspaceService.updateWorkspaceForUser({
      workspaceId,
      userId: user.id,
      ...(normalizedName !== undefined ? { name: normalizedName } : {}),
      ...(body.slug !== undefined ? { slug: body.slug } : {}),
    });

    return apiSuccess(workspace);
  }

  @Delete(':workspaceId')
  @HttpCode(HttpStatus.OK)
  async archiveWorkspace(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaceService.archiveWorkspaceForUser({
      workspaceId,
      userId: user.id,
    });

    return apiSuccess({ archived: true });
  }

  @Patch(':workspaceId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreWorkspace(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
  ) {
    await this.workspaceService.restoreWorkspaceForUser({
      workspaceId,
      userId: user.id,
    });

    return apiSuccess({ archived: false });
  }

  @Get(':workspaceId/members')
  async getWorkspaceMembers(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
  ) {
    const members: WorkspaceMemberItemDTO[] = await this.workspaceService.getWorkspaceMembers(
      workspaceId,
      user.id,
    );
    return apiSuccess(members);
  }

  @Patch(':workspaceId/members/:memberId')
  async updateMemberRole(
    @CurrentUser() user: AuthUserDTO,
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role?: string },
  ) {
    if (!body.role) {
      throw new BadRequestException('Role is required');
    }
    await this.workspaceService.updateMemberRole({
      workspaceId,
      memberId,
      role: body.role,
      currentUserId: user.id,
    });
    return apiSuccess({ updated: true });
  }
}

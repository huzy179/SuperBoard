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
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthUserDTO,
  CommentListResponseDTO,
  CreateCommentRequestDTO,
  CreateCommentResponseDTO,
  CreateProjectRequestDTO,
  CreateProjectResponseDTO,
  CreateTaskRequestDTO,
  CreateTaskResponseDTO,
  DeleteCommentResponseDTO,
  DeleteProjectResponseDTO,
  DeleteTaskResponseDTO,
  ProjectDetailResponseDTO,
  ProjectsResponseDTO,
  UpdateCommentRequestDTO,
  UpdateCommentResponseDTO,
  UpdateProjectRequestDTO,
  UpdateProjectResponseDTO,
  UpdateTaskRequestDTO,
  UpdateTaskResponseDTO,
  UpdateTaskStatusRequestDTO,
  UpdateTaskStatusResponseDTO,
} from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private commentService: CommentService,
  ) {}

  @Get()
  async getProjects(
    @CurrentUser() user: AuthUserDTO,
    @Query('showArchived') showArchived?: string,
  ): Promise<ProjectsResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const projects = await this.projectService.getProjectsByWorkspace(user.defaultWorkspaceId, {
      showArchived: this.parseBooleanQuery(showArchived),
    });

    return apiSuccess(projects);
  }

  @Get(':projectId')
  async getProjectDetail(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Query('showArchived') showArchived?: string,
  ): Promise<ProjectDetailResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const project = await this.projectService.getProjectByIdForWorkspace(
      projectId,
      user.defaultWorkspaceId,
      {
        showArchived: this.parseBooleanQuery(showArchived),
      },
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return apiSuccess(project);
  }

  @Post()
  async createProject(
    @CurrentUser() user: AuthUserDTO,
    @Body() body: Partial<CreateProjectRequestDTO>,
  ): Promise<CreateProjectResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('Project name is required');
    }

    const description = body.description?.trim();
    const color = body.color?.trim();
    const icon = body.icon?.trim();

    const project = await this.projectService.createProject(user.defaultWorkspaceId, {
      name,
      ...(description ? { description } : {}),
      ...(color ? { color } : {}),
      ...(icon ? { icon } : {}),
    });

    return apiSuccess(project);
  }

  @Patch(':projectId')
  async updateProject(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: UpdateProjectRequestDTO,
  ): Promise<UpdateProjectResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const normalizedName = body.name?.trim();
    if (body.name !== undefined && !normalizedName) {
      throw new BadRequestException('Project name is required');
    }

    const project = await this.projectService.updateProjectForWorkspace({
      projectId,
      workspaceId: user.defaultWorkspaceId,
      data: {
        ...(normalizedName !== undefined ? { name: normalizedName } : {}),
        ...(body.description !== undefined ? { description: body.description.trim() } : {}),
        ...(body.color !== undefined ? { color: body.color.trim() } : {}),
        ...(body.icon !== undefined ? { icon: body.icon.trim() } : {}),
      },
    });

    return apiSuccess(project);
  }

  @Delete(':projectId')
  @HttpCode(HttpStatus.OK)
  async deleteProject(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ): Promise<DeleteProjectResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    await this.projectService.archiveProjectForWorkspace({
      projectId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess({ deleted: true });
  }

  @Patch(':projectId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreProject(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ): Promise<DeleteProjectResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    await this.projectService.restoreProjectForWorkspace({
      projectId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess({ deleted: false });
  }

  @Post(':projectId/tasks')
  async createTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: Partial<CreateTaskRequestDTO>,
  ): Promise<CreateTaskResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const title = body.title?.trim();
    if (!title) {
      throw new BadRequestException('Task title is required');
    }

    const description = body.description?.trim();
    const status = body.status ?? 'todo';
    const priority = body.priority ?? 'medium';
    const assigneeId = body.assigneeId?.trim();
    const dueDate = this.parseOptionalDate(body.dueDate);

    const task = await this.projectService.createTaskForProject({
      projectId,
      workspaceId: user.defaultWorkspaceId,
      title,
      ...(description ? { description } : {}),
      status,
      priority,
      ...(assigneeId ? { assigneeId } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    });

    return apiSuccess(task);
  }

  @Patch(':projectId/tasks/:taskId/status')
  async updateTaskStatus(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: Partial<UpdateTaskStatusRequestDTO>,
  ): Promise<UpdateTaskStatusResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    if (!body.status) {
      throw new BadRequestException('Task status is required');
    }

    const task = await this.projectService.updateTaskStatusForProject({
      projectId,
      taskId,
      workspaceId: user.defaultWorkspaceId,
      status: body.status,
    });

    return apiSuccess(task);
  }

  @Patch(':projectId/tasks/:taskId')
  async updateTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskRequestDTO,
  ): Promise<UpdateTaskResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const normalizedTitle = body.title?.trim();
    if (body.title !== undefined && !normalizedTitle) {
      throw new BadRequestException('Task title is required');
    }

    const normalizedDescription = body.description?.trim();
    const normalizedAssigneeId = body.assigneeId?.trim();
    const dueDate = this.parseOptionalDate(body.dueDate);

    const task = await this.projectService.updateTaskForProject({
      projectId,
      taskId,
      workspaceId: user.defaultWorkspaceId,
      data: {
        ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
        ...(body.description !== undefined ? { description: normalizedDescription ?? '' } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: normalizedAssigneeId || null } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
    });

    return apiSuccess(task);
  }

  @Delete(':projectId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  async deleteTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<DeleteTaskResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    await this.projectService.deleteTaskForProject({
      projectId,
      taskId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess({ deleted: true });
  }

  // Comment endpoints

  @Get(':projectId/tasks/:taskId/comments')
  async listComments(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<CommentListResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const comments = await this.commentService.getCommentsByTask({
      projectId,
      taskId,
      workspaceId: user.defaultWorkspaceId,
    });

    return apiSuccess(comments);
  }

  @Post(':projectId/tasks/:taskId/comments')
  async createComment(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: Partial<CreateCommentRequestDTO>,
  ): Promise<CreateCommentResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const comment = await this.commentService.createComment({
      projectId,
      taskId,
      workspaceId: user.defaultWorkspaceId,
      authorId: user.id,
      content: body.content ?? '',
    });

    return apiSuccess(comment);
  }

  @Patch(':projectId/tasks/:taskId/comments/:commentId')
  async updateComment(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
    @Body() body: Partial<UpdateCommentRequestDTO>,
  ): Promise<UpdateCommentResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const comment = await this.commentService.updateComment({
      projectId,
      taskId,
      commentId,
      workspaceId: user.defaultWorkspaceId,
      currentUserId: user.id,
      content: body.content ?? '',
    });

    return apiSuccess(comment);
  }

  @Delete(':projectId/tasks/:taskId/comments/:commentId')
  @HttpCode(HttpStatus.OK)
  async deleteComment(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Param('commentId') commentId: string,
  ): Promise<DeleteCommentResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const result = await this.commentService.deleteComment({
      projectId,
      taskId,
      commentId,
      workspaceId: user.defaultWorkspaceId,
      currentUserId: user.id,
    });

    return apiSuccess(result);
  }

  private parseOptionalDate(rawDate?: string | null): Date | null | undefined {
    if (rawDate === undefined) {
      return undefined;
    }

    if (rawDate === null || rawDate === '') {
      return null;
    }

    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }

    return parsedDate;
  }

  private parseBooleanQuery(value?: string): boolean {
    if (value === undefined) {
      return false;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    throw new BadRequestException('showArchived must be true or false');
  }
}

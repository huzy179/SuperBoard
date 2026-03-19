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
  UnauthorizedException,
} from '@nestjs/common';
import type {
  AuthUserDTO,
  CreateProjectRequestDTO,
  CreateProjectResponseDTO,
  CreateTaskRequestDTO,
  CreateTaskResponseDTO,
  DeleteProjectResponseDTO,
  DeleteTaskResponseDTO,
  ProjectDetailResponseDTO,
  ProjectsResponseDTO,
  UpdateProjectRequestDTO,
  UpdateProjectResponseDTO,
  UpdateTaskRequestDTO,
  UpdateTaskResponseDTO,
  UpdateTaskStatusRequestDTO,
  UpdateTaskStatusResponseDTO,
} from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectService } from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  async getProjects(@CurrentUser() user: AuthUserDTO): Promise<ProjectsResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const projects = await this.projectService.getProjectsByWorkspace(user.defaultWorkspaceId);

    return apiSuccess(projects);
  }

  @Get(':projectId')
  async getProjectDetail(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ): Promise<ProjectDetailResponseDTO> {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }

    const project = await this.projectService.getProjectByIdForWorkspace(
      projectId,
      user.defaultWorkspaceId,
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
}

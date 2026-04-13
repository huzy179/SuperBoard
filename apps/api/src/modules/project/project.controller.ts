import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import type {
  AuthUserDTO,
  CreateProjectRequestDTO,
  CreateProjectResponseDTO,
  CreateTaskRequestDTO,
  CreateTaskResponseDTO,
  DashboardStatsResponseDTO,
  DeleteProjectResponseDTO,
  ProjectDetailResponseDTO,
  ProjectsResponseDTO,
  UpdateProjectRequestDTO,
  UpdateProjectResponseDTO,
} from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { requireWorkspace, findOrThrow, parseBooleanQuery } from '../../common/helpers';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProjectService } from './project.service';
import { ChronologyService } from './chronology.service';
import { CommandService } from './command.service';
import { ForecastService } from './forecast.service';
import { SimulationService } from './simulation.service';

@Controller('v1/projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private chronologyService: ChronologyService,
    private commandService: CommandService,
    private forecastService: ForecastService,
    private simulationService: SimulationService,
  ) {}

  @Post(':projectId/simulate')
  async runSimulation(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body()
    params: { velocityMultiplier: number; addedPoints: number; driftIntensityModifier: number },
  ) {
    const data = await this.simulationService.runMissionSimulation(projectId, params);
    return apiSuccess(data);
  }

  @Get(':projectId/forecast')
  async getMissionForecast(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.forecastService.getMissionForecast(projectId);
    return apiSuccess(data);
  }

  @Get(':projectId/briefing')
  async getMissionBriefing(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    const data = await this.commandService.getMissionBriefing(projectId);
    return apiSuccess(data);
  }

  @Get(':projectId/chronology')
  async getProjectChronology(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ) {
    const workspaceId = requireWorkspace(user);

    // Verify project access
    await findOrThrow(
      this.projectService.getProjectByIdForWorkspace(projectId, workspaceId),
      'Project',
    );

    const timeline = await this.chronologyService.getProjectTimeline(projectId);
    return apiSuccess(timeline);
  }

  @Get()
  async getProjects(
    @CurrentUser() user: AuthUserDTO,
    @Query('showArchived') showArchived?: string,
  ): Promise<ProjectsResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const projects = await this.projectService.getProjectsByWorkspace(workspaceId, {
      showArchived: parseBooleanQuery(showArchived),
    });

    return apiSuccess(projects);
  }

  @Get('dashboard')
  async getDashboardStats(@CurrentUser() user: AuthUserDTO): Promise<DashboardStatsResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const stats = await this.projectService.getDashboardStats(workspaceId);
    return apiSuccess(stats);
  }

  @Get(':projectId')
  async getProjectDetail(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Query('showArchived') showArchived?: string,
  ): Promise<ProjectDetailResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const project = await findOrThrow(
      this.projectService.getProjectByIdForWorkspace(projectId, workspaceId, {
        showArchived: parseBooleanQuery(showArchived),
      }),
      'Project',
    );

    return apiSuccess(project);
  }

  @Post()
  async createProject(
    @CurrentUser() user: AuthUserDTO,
    @Body() body: Partial<CreateProjectRequestDTO>,
  ): Promise<CreateProjectResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const name = body.name?.trim();
    if (!name) {
      throw new BadRequestException('Project name is required');
    }

    const description = body.description?.trim();
    const color = body.color?.trim();
    const icon = body.icon?.trim();

    const project = await this.projectService.createProject(workspaceId, {
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
    const workspaceId = requireWorkspace(user);

    const normalizedName = body.name?.trim();
    if (body.name !== undefined && !normalizedName) {
      throw new BadRequestException('Project name is required');
    }

    const project = await this.projectService.updateProjectForWorkspace({
      projectId,
      workspaceId,
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
    const workspaceId = requireWorkspace(user);

    await this.projectService.archiveProjectForWorkspace({
      projectId,
      workspaceId,
    });

    return apiSuccess({ deleted: true });
  }

  @Patch(':projectId/restore')
  @HttpCode(HttpStatus.OK)
  async restoreProject(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
  ): Promise<DeleteProjectResponseDTO> {
    const workspaceId = requireWorkspace(user);

    await this.projectService.restoreProjectForWorkspace({
      projectId,
      workspaceId,
    });

    return apiSuccess({ deleted: false });
  }

  @Post(':projectId/plan')
  async planProject(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: { goal: string },
  ) {
    if (!body.goal) throw new BadRequestException('Goal is required');
    const result = await this.projectService.planProjectWithAi(projectId, body.goal);
    return apiSuccess(result);
  }

  @Post(':projectId/tasks')
  async createTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: Partial<CreateTaskRequestDTO>,
  ): Promise<CreateTaskResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const title = body.title?.trim();
    if (!title) {
      throw new BadRequestException('Task title is required');
    }

    const description = body.description?.trim();
    const status = body.status ?? 'todo';
    const priority = body.priority ?? 'medium';
    const assigneeId = body.assigneeId?.trim();
    const hasParentTaskId = Object.prototype.hasOwnProperty.call(body, 'parentTaskId');
    const normalizedParentTaskId = body.parentTaskId?.trim();
    const dueDate = this.parseOptionalDate(body.dueDate);

    const task = await this.projectService.createTaskForProject({
      projectId,
      workspaceId,
      actorId: user.id,
      title,
      ...(description ? { description } : {}),
      status,
      priority,
      ...(body.type ? { type: body.type } : {}),
      ...(body.storyPoints !== undefined ? { storyPoints: body.storyPoints } : {}),
      ...(body.labelIds ? { labelIds: body.labelIds } : {}),
      ...(assigneeId ? { assigneeId } : {}),
      ...(hasParentTaskId ? { parentTaskId: normalizedParentTaskId || null } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
    });

    this.projectGateway.emitProjectUpdated(projectId);
    this.projectGateway.emitProjectTaskPatched({
      projectId,
      taskId: task.id,
      status: task.status,
      ...(task.position !== undefined ? { position: task.position } : {}),
      updatedAt: task.updatedAt,
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
    const workspaceId = requireWorkspace(user);

    if (!body.status) {
      throw new BadRequestException('Task status is required');
    }

    const task = await this.projectService.updateTaskStatusForProject({
      projectId,
      taskId,
      workspaceId,
      actorId: user.id,
      status: body.status,
      ...(Object.prototype.hasOwnProperty.call(body, 'position')
        ? { position: body.position ?? null }
        : {}),
    });

    this.projectGateway.emitProjectUpdated(projectId);

    return apiSuccess(task);
  }

  @Patch(':projectId/tasks/bulk')
  async bulkTaskOperation(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Body() body: Partial<BulkTaskOperationRequestDTO>,
  ): Promise<BulkTaskOperationResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const taskIds = (body.taskIds ?? []).map((id) => id.trim()).filter(Boolean);
    if (taskIds.length === 0) {
      throw new BadRequestException('Task ids are required');
    }

    const hasStatus = body.status !== undefined;
    const hasPriority = body.priority !== undefined;
    const hasType = body.type !== undefined;
    const hasDueDate = Object.prototype.hasOwnProperty.call(body, 'dueDate');
    const hasAssignee = Object.prototype.hasOwnProperty.call(body, 'assigneeId');
    const shouldDelete = body.delete === true;

    if (!hasStatus && !hasPriority && !hasType && !hasDueDate && !hasAssignee && !shouldDelete) {
      throw new BadRequestException('At least one bulk operation is required');
    }

    const normalizedAssigneeId: string | null = body.assigneeId?.trim() || null;
    const normalizedDueDate = hasDueDate ? this.parseOptionalDate(body.dueDate) : undefined;

    const result = await this.projectService.bulkOperateTasksForProject({
      projectId,
      workspaceId,
      actorId: user.id,
      taskIds,
      ...(hasStatus ? { status: body.status } : {}),
      ...(hasPriority ? { priority: body.priority } : {}),
      ...(hasType ? { type: body.type } : {}),
      ...(hasDueDate ? { dueDate: normalizedDueDate ?? null } : {}),
      ...(hasAssignee ? { assigneeId: normalizedAssigneeId } : {}),
      ...(shouldDelete ? { delete: true } : {}),
    });

    this.projectGateway.emitProjectUpdated(projectId);

    return apiSuccess(result);
  }

  @Patch(':projectId/tasks/:taskId')
  async updateTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateTaskRequestDTO,
  ): Promise<UpdateTaskResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const normalizedTitle = body.title?.trim();
    if (body.title !== undefined && !normalizedTitle) {
      throw new BadRequestException('Task title is required');
    }

    const normalizedDescription = body.description?.trim();
    const normalizedAssigneeId = body.assigneeId?.trim();
    const hasParentTaskId = Object.prototype.hasOwnProperty.call(body, 'parentTaskId');
    const normalizedParentTaskId = body.parentTaskId?.trim();
    const dueDate = this.parseOptionalDate(body.dueDate);

    const task = await this.projectService.updateTaskForProject({
      projectId,
      taskId,
      workspaceId,
      actorId: user.id,
      data: {
        ...(normalizedTitle !== undefined ? { title: normalizedTitle } : {}),
        ...(body.description !== undefined ? { description: normalizedDescription ?? '' } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.priority !== undefined ? { priority: body.priority } : {}),
        ...(body.type !== undefined ? { type: body.type } : {}),
        ...(body.storyPoints !== undefined ? { storyPoints: body.storyPoints } : {}),
        ...(body.position !== undefined ? { position: body.position } : {}),
        ...(body.labelIds !== undefined ? { labelIds: body.labelIds } : {}),
        ...(body.assigneeId !== undefined ? { assigneeId: normalizedAssigneeId || null } : {}),
        ...(hasParentTaskId ? { parentTaskId: normalizedParentTaskId || null } : {}),
        ...(dueDate !== undefined ? { dueDate } : {}),
      },
    });

    this.projectGateway.emitProjectUpdated(projectId);

    return apiSuccess(task);
  }

  @Delete(':projectId/tasks/:taskId')
  @HttpCode(HttpStatus.OK)
  async deleteTask(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<DeleteTaskResponseDTO> {
    const workspaceId = requireWorkspace(user);

    await this.projectService.deleteTaskForProject({
      projectId,
      taskId,
      workspaceId,
      actorId: user.id,
    });

    this.projectGateway.emitProjectUpdated(projectId);

    return apiSuccess({ deleted: true });
  }

  // Comment endpoints

  @Get(':projectId/tasks/:taskId/history')
  async getTaskHistory(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
  ): Promise<TaskHistoryResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const history = await this.projectService.getTaskHistoryForProject({
      projectId,
      taskId,
      workspaceId,
    });

    return apiSuccess(history);
  }

  @Get(':projectId/tasks/:taskId/comments')
  async listComments(
    @CurrentUser() user: AuthUserDTO,
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ): Promise<CommentListResponseDTO> {
    const workspaceId = requireWorkspace(user);

    const comments = await this.commentService.getCommentsByTask({
      projectId,
      taskId,
      workspaceId,
      ...(cursor ? { cursor } : {}),
      ...(limit ? { limit: parseInt(limit, 10) } : {}),
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
    const workspaceId = requireWorkspace(user);

    const comment = await this.commentService.createComment({
      projectId,
      taskId,
      workspaceId,
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
    const workspaceId = requireWorkspace(user);

    const comment = await this.commentService.updateComment({
      projectId,
      taskId,
      commentId,
      workspaceId,
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
    const workspaceId = requireWorkspace(user);

    const result = await this.commentService.deleteComment({
      projectId,
      taskId,
      commentId,
      workspaceId,
      currentUserId: user.id,
    });

    return apiSuccess(result);
  }

  private parseOptionalDate(rawDate?: string | null): Date | null | undefined {
    if (rawDate === undefined) return undefined;
    if (rawDate === null || rawDate === '') return null;
    const parsedDate = new Date(rawDate);
    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid due date');
    }
    return parsedDate;
  }
}

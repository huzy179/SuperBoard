import { Controller, Get, UnauthorizedException } from '@nestjs/common';
import type { AuthUserDTO, ProjectsResponseDTO } from '@superboard/shared';
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
}

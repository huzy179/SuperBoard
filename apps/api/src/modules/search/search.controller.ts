import { Controller, Get, Post, Query, Request, Param } from '@nestjs/common';
import { SearchService } from './search.service';
import { GraphService } from './graph.service';
import { SearchResponseDTO, NeuralGraphResponseDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';

@Controller('search')
export class SearchController {
  constructor(
    private searchService: SearchService,
    private graphService: GraphService,
  ) {}

  @Get()
  async search(
    @Request() req: { user: { defaultWorkspaceId: string } },
    @Query('q') q: string,
  ): Promise<SearchResponseDTO> {
    const workspaceId = req.user.defaultWorkspaceId;
    return this.searchService.globalSearch(workspaceId, q || '');
  }

  @Get('sync-status')
  async getSyncStatus(@Request() req: { user: { defaultWorkspaceId: string } }) {
    return this.searchService.getWorkspaceSyncStatus(req.user.defaultWorkspaceId);
  }

  @Post('sync')
  async syncAllEntities(@Request() req: { user: { defaultWorkspaceId: string } }) {
    return this.searchService.syncAllEntities(req.user.defaultWorkspaceId);
  }

  @Get('graph/:projectId')
  async getGraph(@Param('projectId') projectId: string): Promise<NeuralGraphResponseDTO> {
    const graph = await this.graphService.getNeuralGraph(projectId);
    return apiSuccess(graph);
  }

  @Get('answer')
  async getNeuralAnswer(
    @Request() req: { user: { defaultWorkspaceId: string } },
    @Query('q') q: string,
  ) {
    const workspaceId = req.user.defaultWorkspaceId;
    const result = await this.searchService.generateNeuralAnswer(workspaceId, q || '');
    return apiSuccess(result);
  }
}

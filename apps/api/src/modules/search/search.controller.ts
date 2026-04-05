import { Controller, Get, Query, Request } from '@nestjs/common';
import { SearchService } from './search.service';
import { SearchResponseDTO } from '@superboard/shared';

@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(
    @Request() req: { user: { defaultWorkspaceId: string } },
    @Query('q') q: string,
  ): Promise<SearchResponseDTO> {
    const workspaceId = req.user.defaultWorkspaceId;
    return this.searchService.globalSearch(workspaceId, q || '');
  }
}

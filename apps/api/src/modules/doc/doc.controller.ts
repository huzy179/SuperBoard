import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { DocService } from './doc.service';

@Controller('docs')
export class DocController {
  constructor(private docService: DocService) {}

  @Post()
  async createDoc(
    @Query('workspaceId') workspaceId: string,
    @Req() req: { user: { id: string } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() data: { title: string; content?: any; parentDocId?: string },
  ) {
    return this.docService.createDoc(workspaceId, req.user.id, data);
  }

  @Get()
  async getWorkspaceDocs(@Query('workspaceId') workspaceId: string) {
    return this.docService.getWorkspaceDocs(workspaceId);
  }

  @Get(':docId')
  async getDocById(@Param('docId') docId: string) {
    return this.docService.getDocById(docId);
  }

  @Put(':docId')
  async updateDoc(
    @Param('docId') docId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() data: { title?: string; content?: any; parentDocId?: string },
  ) {
    return this.docService.updateDoc(docId, data);
  }

  @Delete(':docId')
  async deleteDoc(@Param('docId') docId: string) {
    return this.docService.deleteDoc(docId);
  }

  @Post(':docId/versions')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVersion(@Param('docId') docId: string, @Body() data: { content: any }) {
    return this.docService.createVersion(docId, data.content);
  }

  @Get(':docId/versions')
  async getDocVersions(@Param('docId') docId: string) {
    return this.docService.getDocVersions(docId);
  }
}

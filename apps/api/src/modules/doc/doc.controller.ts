import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { DocService } from './doc.service';
import { apiSuccess } from '../../common/api-response';

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
    const doc = await this.docService.createDoc(workspaceId, req.user.id, data);
    return apiSuccess(doc);
  }

  @Get()
  async getWorkspaceDocs(@Query('workspaceId') workspaceId: string) {
    const docs = await this.docService.getWorkspaceDocs(workspaceId);
    return apiSuccess(docs);
  }

  @Get(':docId')
  async getDocById(@Param('docId') docId: string) {
    const doc = await this.docService.getDocById(docId);
    return apiSuccess(doc);
  }

  @Put(':docId')
  async updateDoc(
    @Param('docId') docId: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Body() data: { title?: string; content?: any; parentDocId?: string },
  ) {
    const doc = await this.docService.updateDoc(docId, data);
    return apiSuccess(doc);
  }

  @Delete(':docId')
  async deleteDoc(@Param('docId') docId: string) {
    await this.docService.deleteDoc(docId);
    return apiSuccess({ deleted: true });
  }

  @Post(':docId/versions')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createVersion(@Param('docId') docId: string, @Body() data: { content: any }) {
    const version = await this.docService.createVersion(docId, data.content);
    return apiSuccess(version);
  }

  @Get(':docId/versions')
  async getDocVersions(@Param('docId') docId: string) {
    const versions = await this.docService.getDocVersions(docId);
    return apiSuccess(versions);
  }
}

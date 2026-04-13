import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ConnectService } from './connect.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { apiSuccess } from '../../common/api-response.helper';

@Controller('v1/connect')
export class ConnectController {
  constructor(private connectService: ConnectService) {}

  @Get('integrations')
  @UseGuards(JwtAuthGuard)
  async getIntegrations(@Query('workspaceId') workspaceId: string) {
    const integrations = await this.connectService.getIntegrations(workspaceId);
    return apiSuccess({ integrations });
  }

  @Post('integrations')
  @UseGuards(JwtAuthGuard)
  async createIntegration(
    @Query('workspaceId') workspaceId: string,
    @Body() data: Record<string, unknown>,
  ) {
    const integration = await this.connectService.createIntegration(workspaceId, data);
    return apiSuccess({ integration });
  }

  @Delete('integrations/:id')
  @UseGuards(JwtAuthGuard)
  async deleteIntegration(@Param('id') id: string, @Query('workspaceId') workspaceId: string) {
    await this.connectService.deleteIntegration(id, workspaceId);
    return apiSuccess({ status: 'deleted' });
  }

  /**
   * Public Webhook Ingestor
   */
  @Post('hooks/:provider')
  async handleWebhook(
    @Param('provider') provider: string,
    @Body() payload: Record<string, unknown>,
  ) {
    const result = await this.connectService.handleIncomingWebhook(provider, payload);
    return apiSuccess(result);
  }
}

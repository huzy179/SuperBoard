import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChannelType } from '@superboard/shared';

@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('channel')
  async createChannel(
    @Query('workspaceId') workspaceId: string,
    @Body() data: { name: string; description?: string; type: ChannelType },
  ) {
    return this.chatService.createChannel(workspaceId, data);
  }

  @Get('channels')
  async getWorkspaceChannels(@Query('workspaceId') workspaceId: string) {
    return this.chatService.getWorkspaceChannels(workspaceId);
  }

  @Post('channels/:channelId/join')
  async joinChannel(@Param('channelId') channelId: string, @Req() req: { user: { id: string } }) {
    return this.chatService.joinChannel(channelId, req.user.id);
  }

  @Post('channels/:channelId/messages')
  async sendMessage(
    @Param('channelId') channelId: string,
    @Req() req: { user: { id: string } },
    @Body() data: { content: string; parentId?: string },
  ) {
    return this.chatService.sendMessage(channelId, req.user.id, data.content, data.parentId);
  }

  @Get('channels/:channelId/messages')
  async getChannelMessages(
    @Param('channelId') channelId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getChannelMessages(
      channelId,
      cursor,
      limit ? parseInt(limit) : undefined,
    );
  }
}

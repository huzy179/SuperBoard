import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserDTO } from '@superboard/shared';
import { ChatService } from './chat.service';
import { SendMessageDto, UpdateMessageDto, AddReactionDto } from './dto/chat.dto';
import { ChatGateway } from './chat.gateway';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';

@Controller('chat')
@UseGuards(BearerAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('channels')
  async getChannels(@Query('workspaceId') workspaceId: string, @CurrentUser() user: AuthUserDTO) {
    return this.chatService.getChannels(workspaceId, user.id);
  }

  @Get('channels/:channelId/messages')
  async getMessages(@Param('channelId') channelId: string, @Query('cursor') cursor?: string) {
    return this.chatService.getMessages(channelId, cursor);
  }

  @Get('messages/:messageId/thread')
  async getThreadMessages(@Param('messageId') messageId: string) {
    return this.chatService.getThreadMessages(messageId);
  }

  @Post('channels/:channelId/messages')
  async createMessage(
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const message = await this.chatService.createMessage(channelId, user.id, dto);
    const messageDTO = this.chatService.mapMessageToDTO(message);
    this.chatGateway.broadcastMessage(channelId, messageDTO);
    return messageDTO;
  }

  @Put('messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const message = await this.chatService.updateMessage(messageId, user.id, dto);
    const messageDTO = this.chatService.mapMessageToDTO(message);
    this.chatGateway.broadcastUpdate(message.channelId, messageDTO);
    return messageDTO;
  }

  @Delete('messages/:messageId')
  async deleteMessage(@Param('messageId') messageId: string, @CurrentUser() user: AuthUserDTO) {
    const message = await this.chatService.deleteMessage(messageId, user.id);
    this.chatGateway.broadcastDelete(message.channelId, messageId);
    return { success: true };
  }

  @Post('messages/:messageId/reactions')
  async addReaction(
    @Param('messageId') messageId: string,
    @Body() dto: AddReactionDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    await this.chatService.addReaction(messageId, user.id, dto);
    const message = await this.chatService.getMessage(messageId);
    this.chatGateway.broadcastReaction(message.channelId, {
      messageId,
      userId: user.id,
      emoji: dto.emoji,
    });
    return { success: true };
  }

  @Post('channels/:channelId/join')
  async joinChannel(@Param('channelId') channelId: string, @CurrentUser() user: AuthUserDTO) {
    await this.chatService.joinChannel(channelId, user.id);
    return { success: true };
  }
}

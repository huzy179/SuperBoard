import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserDTO } from '@superboard/shared';
import { ChatService } from './chat.service';
import {
  SendMessageDto,
  UpdateMessageDto,
  AddReactionDto,
  CreateChannelDto,
  CreateDmDto,
  UpdateChannelDto,
  AddChannelMemberDto,
} from './dto/chat.dto';
import { ChatGateway } from './chat.gateway';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';
import { apiSuccess } from '../../common/api-response';

@Controller('chat')
@UseGuards(BearerAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private chatGateway: ChatGateway,
  ) {}

  @Get('channels')
  async getChannels(@Query('workspaceId') workspaceId: string, @CurrentUser() user: AuthUserDTO) {
    const data = await this.chatService.getChannels(workspaceId, user.id);
    return apiSuccess(data);
  }

  @Post('channel')
  async createChannel(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const data = await this.chatService.createChannel(workspaceId, user.id, dto);
    return apiSuccess(data);
  }

  @Post('dm')
  async getOrCreateDm(
    @Query('workspaceId') workspaceId: string,
    @Body() dto: CreateDmDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const data = await this.chatService.getOrCreateDm(workspaceId, user.id, dto.otherUserId);
    return apiSuccess(data);
  }

  @Get('dm')
  async findDm(
    @Query('workspaceId') workspaceId: string,
    @Query('otherUserId') otherUserId: string,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const data = await this.chatService.findDm(workspaceId, user.id, otherUserId);
    return apiSuccess(data);
  }

  @Get('channels/:channelId/messages')
  async getMessages(@Param('channelId') channelId: string, @Query('cursor') cursor?: string) {
    const data = await this.chatService.getMessages(channelId, cursor);
    return apiSuccess(data);
  }

  @Get('channels/:channelId/members')
  async getChannelMembers(@Param('channelId') channelId: string, @CurrentUser() user: AuthUserDTO) {
    const data = await this.chatService.getChannelMembers(channelId, user.id);
    return apiSuccess(data);
  }

  @Post('channels/:channelId/members')
  async addChannelMember(
    @Param('channelId') channelId: string,
    @Body() dto: AddChannelMemberDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const data = await this.chatService.addChannelMember(channelId, user.id, dto.userId);
    return apiSuccess(data);
  }

  @Put('channels/:channelId')
  async updateChannel(
    @Param('channelId') channelId: string,
    @Body() dto: UpdateChannelDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const data = await this.chatService.updateChannel(channelId, user.id, dto);
    return apiSuccess(data);
  }

  @Delete('channels/:channelId/members/me')
  async leaveChannel(@Param('channelId') channelId: string, @CurrentUser() user: AuthUserDTO) {
    const data = await this.chatService.leaveChannel(channelId, user.id);
    return apiSuccess(data);
  }

  @Get('messages/:messageId/thread')
  async getThreadMessages(@Param('messageId') messageId: string) {
    const data = await this.chatService.getThreadMessages(messageId);
    return apiSuccess(data);
  }

  @Post('channels/:channelId/messages')
  async createMessage(
    @Param('channelId') channelId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const message = await this.chatService.createMessage(channelId, user.id, dto);
    const messageDTO = this.chatService.mapMessageToDTO(message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.chatGateway.broadcastMessage(channelId, messageDTO as any);
    return apiSuccess(messageDTO);
  }

  @Put('messages/:messageId')
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() dto: UpdateMessageDto,
    @CurrentUser() user: AuthUserDTO,
  ) {
    const message = await this.chatService.updateMessage(messageId, user.id, dto);
    const messageDTO = this.chatService.mapMessageToDTO(message);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.chatGateway.broadcastUpdate(message.channelId, messageDTO as any);
    return apiSuccess(messageDTO);
  }

  @Delete('messages/:messageId')
  async deleteMessage(@Param('messageId') messageId: string, @CurrentUser() user: AuthUserDTO) {
    const message = await this.chatService.deleteMessage(messageId, user.id);
    this.chatGateway.broadcastDelete(message.channelId, messageId);
    return apiSuccess({ deleted: true });
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
    return apiSuccess({ added: true });
  }

  @Post('channels/:channelId/join')
  async joinChannel(@Param('channelId') channelId: string, @CurrentUser() user: AuthUserDTO) {
    await this.chatService.joinChannel(channelId, user.id);
    return apiSuccess({ joined: true });
  }
}

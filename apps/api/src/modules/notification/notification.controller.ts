import { Controller, Get, Param, Patch, UnauthorizedException } from '@nestjs/common';
import type { AuthUserDTO } from '@superboard/shared';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  async getNotifications(@CurrentUser() user: AuthUserDTO) {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }
    const result = await this.notificationService.getNotifications(
      user.id,
      user.defaultWorkspaceId,
    );
    return apiSuccess(result);
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser() user: AuthUserDTO, @Param('id') id: string) {
    await this.notificationService.markAsRead(id, user.id);
    return apiSuccess({ success: true });
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser() user: AuthUserDTO) {
    if (!user?.defaultWorkspaceId) {
      throw new UnauthorizedException('Workspace not found');
    }
    await this.notificationService.markAllAsRead(user.id, user.defaultWorkspaceId);
    return apiSuccess({ success: true });
  }
}

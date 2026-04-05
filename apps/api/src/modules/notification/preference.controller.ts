import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import type {
  AuthUserDTO,
  NotificationPreferenceDTO,
  UpdateNotificationPreferenceRequestDTO,
} from '@superboard/shared';

@Controller('auth/me/preferences')
@UseGuards(BearerAuthGuard)
export class PreferenceController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getPreferences(@CurrentUser() user: AuthUserDTO): Promise<NotificationPreferenceDTO> {
    const prefs = await this.notificationService.getUserPreferences(user.id);
    return prefs as unknown as NotificationPreferenceDTO;
  }

  @Patch()
  async updatePreferences(
    @CurrentUser() user: AuthUserDTO,
    @Body() data: UpdateNotificationPreferenceRequestDTO,
  ): Promise<NotificationPreferenceDTO> {
    const prefs = await this.notificationService.updatePreferences(user.id, data);
    return prefs as unknown as NotificationPreferenceDTO;
  }
}

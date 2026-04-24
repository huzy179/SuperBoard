import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import { apiSuccess } from '../../common/api-response';
import type { AuthUserDTO, UpdateNotificationPreferenceRequestDTO } from '@superboard/shared';

@Controller('auth/me/preferences')
@UseGuards(BearerAuthGuard)
export class PreferenceController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getPreferences(@CurrentUser() user: AuthUserDTO) {
    const prefs = await this.notificationService.getUserPreferences(user.id);
    return apiSuccess(prefs);
  }

  @Patch()
  async updatePreferences(
    @CurrentUser() user: AuthUserDTO,
    @Body() data: UpdateNotificationPreferenceRequestDTO,
  ) {
    const prefs = await this.notificationService.updatePreferences(user.id, data);
    return apiSuccess(prefs);
  }
}

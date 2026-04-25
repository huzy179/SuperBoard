/**
 * Internal endpoint for Notification Service worker to persist in-app notifications.
 * Only accessible from internal network (Notification Service → Core API).
 * Protected by a shared internal secret via X-Internal-Secret header.
 */
import { Body, Controller, Headers, Post, UnauthorizedException } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { apiSuccess } from '../../common/api-response';

interface PersistInAppNotificationBody {
  id: string;
  userId: string;
  workspaceId: string;
  type: string;
  payload: Record<string, unknown>;
}

@Controller('internal/notifications')
export class NotificationInternalController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('in-app')
  async persistInApp(
    @Headers('x-internal-secret') secret: string,
    @Body() body: PersistInAppNotificationBody,
  ) {
    const expectedSecret = process.env.INTERNAL_API_SECRET ?? '';
    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException('Invalid internal secret');
    }

    const notification = await this.notificationService.persistInAppNotification({
      id: body.id,
      userId: body.userId,
      workspaceId: body.workspaceId,
      type: body.type,
      payload: body.payload,
    });

    return apiSuccess({ id: notification.id });
  }
}

import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type NotificationEnv } from './env';

export const NOTIFICATION_SHARED_CONFIG = Symbol('NOTIFICATION_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: NOTIFICATION_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<NotificationEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [NOTIFICATION_SHARED_CONFIG],
})
export class SharedConfigModule {}

import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AutomationEnv } from './env';

export const AUTOMATION_SHARED_CONFIG = Symbol('AUTOMATION_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: AUTOMATION_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<AutomationEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [AUTOMATION_SHARED_CONFIG],
})
export class SharedConfigModule {}

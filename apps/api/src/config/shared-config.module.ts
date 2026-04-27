import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AppEnv } from './env';

export const API_SHARED_CONFIG = Symbol('API_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: API_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<AppEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [API_SHARED_CONFIG],
})
export class SharedConfigModule {}

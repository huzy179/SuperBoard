import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type AppEnv } from './env';

import { z } from 'zod';

export const API_SHARED_CONFIG = Symbol('API_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: API_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<AppEnv>({
          schema: envSchema as unknown as z.ZodSchema<AppEnv>,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [API_SHARED_CONFIG],
})
export class SharedConfigModule {}

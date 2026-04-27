import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type SearchEnv } from './env';

export const SEARCH_SHARED_CONFIG = Symbol('SEARCH_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: SEARCH_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<SearchEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [SEARCH_SHARED_CONFIG],
})
export class SharedConfigModule {}

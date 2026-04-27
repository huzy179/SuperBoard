import { Module } from '@nestjs/common';
import { ConfigService as SharedConfigService } from '@superboard/backend-shared/config';
import { envSchema, type CollaborationEnv } from './env';

export const COLLABORATION_SHARED_CONFIG = Symbol('COLLABORATION_SHARED_CONFIG');

@Module({
  providers: [
    {
      provide: COLLABORATION_SHARED_CONFIG,
      useFactory: () =>
        new SharedConfigService<CollaborationEnv>({
          schema: envSchema,
          validateOnLoad: true,
        }),
    },
  ],
  exports: [COLLABORATION_SHARED_CONFIG],
})
export class SharedConfigModule {}

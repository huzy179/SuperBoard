import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaborationModule } from './collaboration/collaboration.module';
import { HealthModule } from './health/health.module';
import { validateEnv } from './config/env';
import { SharedConfigModule } from './config/shared-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    SharedConfigModule,
    HealthModule,
    CollaborationModule,
  ],
})
export class AppModule {}

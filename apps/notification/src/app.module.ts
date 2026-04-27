import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationWorkerModule } from './worker/notification-worker.module';
import { MetricsModule } from './metrics/metrics.module';
import { validateEnv } from './config/env';
import { SharedConfigModule } from './config/shared-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    MetricsModule,
    SharedConfigModule,
    NotificationWorkerModule,
  ],
})
export class AppModule {}

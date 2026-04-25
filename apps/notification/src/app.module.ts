import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationWorkerModule } from './worker/notification-worker.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
    }),
    MetricsModule,
    NotificationWorkerModule,
  ],
})
export class AppModule {}

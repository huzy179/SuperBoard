import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchEventConsumerModule } from './consumer/search-event-consumer.module';
import { validateEnv } from './config/env';
import { SharedConfigModule } from './config/shared-config.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    SharedConfigModule,
    MetricsModule,
    HealthModule,
    SearchEventConsumerModule,
  ],
})
export class AppModule {}

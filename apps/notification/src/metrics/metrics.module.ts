import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { NotificationMetricsService } from './notification-metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [NotificationMetricsService],
  exports: [NotificationMetricsService],
})
export class MetricsModule {}

import { Module } from '@nestjs/common';
import { MetricsController, MetricsService } from '@superboard/backend-shared/metrics';
import { NotificationMetricsService } from './notification-metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService, NotificationMetricsService],
  exports: [MetricsService, NotificationMetricsService],
})
export class MetricsModule {}

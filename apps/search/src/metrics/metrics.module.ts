import { Module } from '@nestjs/common';
import { MetricsController, MetricsService } from '@superboard/backend-shared/metrics';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}

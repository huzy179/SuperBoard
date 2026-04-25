import { Module } from '@nestjs/common';
import { NotificationWorkerService } from './notification-worker.service';
import { MetricsModule } from '../metrics/metrics.module';

@Module({
  imports: [MetricsModule],
  providers: [NotificationWorkerService],
})
export class NotificationWorkerModule {}

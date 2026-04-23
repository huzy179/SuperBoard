import { forwardRef, Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { AutomationModule } from '../modules/automation/automation.module';

@Module({
  imports: [forwardRef(() => AnalyticsModule), forwardRef(() => AutomationModule)],
  providers: [WorkerService],
  exports: [WorkerService],
})
export class WorkerModule {}

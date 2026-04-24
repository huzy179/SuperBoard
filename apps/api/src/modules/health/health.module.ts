import { Module } from '@nestjs/common';
import { HealthCheckController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [],
  controllers: [HealthCheckController],
  providers: [HealthService],
})
export class HealthModule {}

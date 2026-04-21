import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { AiModule } from '../ai/ai.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ProjectModule } from '../project/project.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { ProjectEventsModule } from '../project-events/project-events.module';

import { ReportController } from './report.controller';
import { ExecutiveController } from './executive.controller';

import { ReportService } from './report.service';
import { WorkflowAutomationService } from './workflow-automation.service';
import { ChronologyService } from './chronology.service';
import { CommandService } from './command.service';
import { ForecastService } from './forecast.service';
import { SimulationService } from './simulation.service';
import { BriefingService } from './briefing.service';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    AiModule,
    KnowledgeModule,
    ProjectModule,
    WorkflowModule,
    ProjectEventsModule,
  ],
  controllers: [ReportController, ExecutiveController],
  providers: [
    ReportService,
    WorkflowAutomationService,
    ChronologyService,
    CommandService,
    ForecastService,
    SimulationService,
    BriefingService,
  ],
  exports: [ReportService, CommandService, ForecastService, SimulationService, BriefingService],
})
export class AnalyticsModule {}

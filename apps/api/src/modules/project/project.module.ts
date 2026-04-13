import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { ProjectGateway } from './project.gateway';
import { MentionService } from './mention.service';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { WorkflowAutomationService } from './workflow-automation.service';
import { ChronologyService } from './chronology.service';
import { CommandService } from './command.service';
import { ForecastService } from './forecast.service';
import { SimulationService } from './simulation.service';
import { DiagnosisService } from '../knowledge/diagnosis.service';
import { DocService } from '../doc/doc.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';

import { WorkflowModule } from '../workflow/workflow.module';
import { AiModule } from '../ai/ai.module';
import { AutomationModule } from '../automation/automation.module';
import { DocModule } from '../doc/doc.module';

@Module({
  imports: [
    AuthModule,
    NotificationModule,
    WorkflowModule,
    AiModule,
    AutomationModule,
    KnowledgeModule,
    DocModule,
  ],
  controllers: [ProjectController, ReportController],
  providers: [
    ProjectService,
    CommentService,
    ProjectGateway,
    MentionService,
    ReportService,
    WorkflowAutomationService,
    ChronologyService,
    CommandService,
    ForecastService,
    SimulationService,
    DiagnosisService,
    DocService,
  ],
  exports: [ProjectService, ReportService, CommandService, ForecastService, SimulationService],
})
export class ProjectModule {}

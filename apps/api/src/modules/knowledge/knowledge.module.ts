import { Module } from '@nestjs/common';
import { KnowledgeController } from './knowledge.controller';
import { QaController } from './qa.controller';
import { GraphService } from './graph.service';
import { DiaryService } from './diary.service';
import { DiagnosisService } from './diagnosis.service';
import { SearchModule } from '../search/search.module';
import { ProjectModule } from '../project/project.module';
import { DocModule } from '../doc/doc.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [SearchModule, ProjectModule, DocModule, AiModule],
  controllers: [KnowledgeController, QaController],
  providers: [GraphService, DiaryService, DiagnosisService],
  exports: [GraphService, DiaryService, DiagnosisService],
})
export class KnowledgeModule {}

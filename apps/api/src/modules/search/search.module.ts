import { forwardRef, Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GraphService } from './graph.service';

@Module({
  imports: [forwardRef(() => AiModule)],
  controllers: [SearchController],
  providers: [SearchService, GraphService],
  exports: [SearchService, GraphService],
})
export class SearchModule {}

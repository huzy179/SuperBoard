import { AiModule } from '../ai/ai.module';

import { GraphService } from './graph.service';

@Module({
  imports: [AiModule],
  controllers: [SearchController],
  providers: [SearchService, GraphService],
  exports: [SearchService, GraphService],
})
export class SearchModule {}

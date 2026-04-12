import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

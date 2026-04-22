import { forwardRef, Module } from '@nestjs/common';
import { DocService } from './doc.service';
import { DocController } from './doc.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [forwardRef(() => AiModule)],
  providers: [DocService],
  controllers: [DocController],
  exports: [DocService],
})
export class DocModule {}

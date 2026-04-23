import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { ProjectModule } from '../project/project.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ProjectModule, AiModule],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}

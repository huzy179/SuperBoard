import { Module } from '@nestjs/common';
import { DocService } from './doc.service';
import { DocController } from './doc.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DocService],
  controllers: [DocController],
  exports: [DocService],
})
export class DocModule {}

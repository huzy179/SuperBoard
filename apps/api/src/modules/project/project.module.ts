import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { CommentService } from './comment.service';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [AuthModule, NotificationModule],
  controllers: [ProjectController],
  providers: [ProjectService, CommentService, PrismaService],
  exports: [ProjectService],
})
export class ProjectModule {}

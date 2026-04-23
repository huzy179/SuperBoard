import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  imports: [AuthModule, forwardRef(() => NotificationModule)],
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}

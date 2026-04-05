import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationController } from './notification.controller';
import { PreferenceController } from './preference.controller';
import { NotificationService } from './notification.service';
import { EmailService } from './email.service';

@Module({
  imports: [AuthModule],
  controllers: [NotificationController, PreferenceController],
  providers: [NotificationService, EmailService],
  exports: [NotificationService, EmailService],
})
export class NotificationModule {}

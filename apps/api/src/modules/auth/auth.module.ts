import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, BearerAuthGuard],
  exports: [AuthService, BearerAuthGuard],
})
export class AuthModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BearerAuthGuard } from '../../common/guards/bearer-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, BearerAuthGuard],
  exports: [AuthService, BearerAuthGuard],
})
export class AuthModule {}

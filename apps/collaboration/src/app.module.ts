import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollaborationModule } from './collaboration/collaboration.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
    }),
    HealthModule,
    CollaborationModule,
  ],
})
export class AppModule {}

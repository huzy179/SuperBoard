import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SearchEventConsumerModule } from './consumer/search-event-consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
    }),
    SearchEventConsumerModule,
  ],
})
export class AppModule {}

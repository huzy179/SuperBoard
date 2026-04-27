import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AutomationEventConsumerModule } from './consumer/automation-event-consumer.module';
import { AmqpEventConsumerModule } from './amqp/amqp-event-consumer.module';
import { validateEnv } from './config/env';
import { SharedConfigModule } from './config/shared-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '.env.example'],
      validate: validateEnv,
    }),
    SharedConfigModule,
    AutomationEventConsumerModule,
    AmqpEventConsumerModule,
  ],
})
export class AppModule {}

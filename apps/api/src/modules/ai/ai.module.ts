import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { TaskModule } from '../task/task.module';
import { DocModule } from '../doc/doc.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TaskModule,
    DocModule,
    ChatModule,
    ClientsModule.register([
      {
        name: 'AI_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'ai',
          protoPath: join(__dirname, '../../../../ai-service/proto/ai_service.proto'),
          url: process.env.AI_SERVICE_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}

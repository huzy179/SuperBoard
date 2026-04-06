import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';

interface SummarizeRequest {
  task_id: string;
  content: string;
}

interface SummarizeResponse {
  summary: string;
}

interface AIService {
  summarizeTask(data: SummarizeRequest): Observable<SummarizeResponse>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private aiServiceClient!: AIService;

  constructor(@Inject('AI_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.aiServiceClient = this.client.getService<AIService>('AIService');
  }

  async summarizeTask(taskId: string, title: string, description: string): Promise<string> {
    const content = `Title: ${title}\nDescription: ${description}`;
    const result = await firstValueFrom(
      this.aiServiceClient.summarizeTask({ task_id: taskId, content }),
    );
    return result.summary;
  }
}

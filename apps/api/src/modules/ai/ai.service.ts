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
  SummarizeTask(data: SummarizeRequest): Observable<SummarizeResponse>;
  GetEmbedding(data: { text: string }): Observable<{ embedding: number[] }>;
  ProcessText(data: { text: string; mode: string }): Observable<{ result: string }>;
  SummarizeChat(data: {
    messages: { author: string; content: string; created_at: string }[];
  }): Observable<{ result: string }>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private aiServiceClient!: AIService;

  constructor(@Inject('AI_PACKAGE') private client: ClientGrpc) {}

  onModuleInit() {
    this.aiServiceClient = this.client.getService<AIService>('AIService');
  }

  async summarizeTask(taskId: string, title: string, description: string): Promise<string> {
    try {
      const content = `Title: ${title}\nDescription: ${description}`;
      const result = await firstValueFrom(
        this.aiServiceClient.SummarizeTask({ task_id: taskId, content }),
      );
      return result.summary;
    } catch (error) {
      console.error('AI Summarization failed:', error);
      return 'Không thể tạo bản tóm tắt lúc này.';
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const result = await firstValueFrom(this.aiServiceClient.GetEmbedding({ text }));
      if (!result?.embedding) {
        throw new Error('Invalid embedding response');
      }
      return result.embedding;
    } catch (error) {
      console.error('AI Embedding failed:', error);
      throw error; // Rethrow because this is critical for search/sync
    }
  }

  async processText(text: string, mode: string): Promise<string> {
    try {
      const result = await firstValueFrom(this.aiServiceClient.ProcessText({ text, mode }));
      return result.result;
    } catch (error) {
      console.error('AI Text Processing failed:', error);
      return text; // Return original on failure
    }
  }

  async summarizeChat(messages: { author: string; content: string; created_at: string }[]): Promise<string> {
    try {
      const result = await firstValueFrom(this.aiServiceClient.SummarizeChat({ messages }));
      return result.result;
    } catch (error) {
      console.error('AI Chat Summarization failed:', error);
      return 'Không thể tạo tóm tắt cuộc hội thoại.';
    }
  }
}

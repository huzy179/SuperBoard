import { Controller, Post, Param, NotFoundException, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { TaskService } from '../task/task.service';
import { DocService } from '../doc/doc.service';
import { ChatService } from '../chat/chat.service';
import { apiSuccess } from '../../common/api-response';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUserDTO } from '@superboard/shared';

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly taskService: TaskService,
    private readonly docService: DocService,
    private readonly chatService: ChatService,
  ) {}

  @Post('tasks/:taskId/summarize')
  async summarizeTask(@CurrentUser() user: AuthUserDTO, @Param('taskId') taskId: string) {
    const task = await this.taskService.getTaskById(taskId);
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const summary = await this.aiService.summarizeTask(task.id, task.title, task.description || '');

    return apiSuccess({ summary });
  }

  @Post('docs/:docId/summarize')
  async summarizeDoc(@CurrentUser() user: AuthUserDTO, @Param('docId') docId: string) {
    const doc = await this.docService.getDocById(docId);
    if (!doc) {
      throw new NotFoundException('Document not found');
    }

    const textContent = await this.docService.getDocTextContent(docId);
    if (!textContent.trim()) {
      return apiSuccess({ summary: 'Tài liệu hiện đang trống, không có gì để tóm tắt.' });
    }

    const summary = await this.aiService.summarizeTask(doc.id, doc.title, textContent);

    return apiSuccess({ summary });
  }

  @Post('text/process')
  async processText(
    @CurrentUser() user: AuthUserDTO,
    @Body() body: { text: string; mode: string },
  ) {
    const result = await this.aiService.processText(body.text, body.mode);
    return apiSuccess({ result });
  }

  @Post('messages/:messageId/summarize')
  async summarizeChatThread(
    @CurrentUser() user: AuthUserDTO,
    @Param('messageId') messageId: string,
  ) {
    const parent = await this.chatService.getMessage(messageId);
    const replies = await this.chatService.getThreadMessages(messageId);

    const allMessages = [parent, ...replies].map((m) => ({
      author: m.author.fullName,
      content: m.content,
      created_at: m.createdAt.toISOString(),
    }));

    const result = await this.aiService.summarizeChat(allMessages);

    return apiSuccess({ summary: result });
  }

  @Post('automation/generate')
  async generateAutomationRule(@CurrentUser() user: AuthUserDTO, @Body() body: { prompt: string }) {
    const result = await this.aiService.generateAutomationRule(body.prompt);
    return apiSuccess(result);
  }
}

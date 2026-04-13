import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { logger } from '../../common/logger';
import { ProjectGateway } from './project.gateway';

@Injectable()
export class WorkflowAutomationService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private projectGateway: ProjectGateway,
  ) {}

  async processCommentIntent(input: {
    taskId: string;
    projectId: string;
    workspaceId: string;
    authorId: string;
    content: string;
  }) {
    try {
      // 1. Detect Intent via AI
      const aiResponse = await this.aiService.processText(input.content, 'detect_transition');
      let prediction: { targetStatus: string | null; confidence: number };

      try {
        prediction = JSON.parse(aiResponse);
      } catch {
        return; // Failed to parse AI intent
      }

      if (!prediction.targetStatus || prediction.confidence < 0.8) {
        return; // Confidence too low
      }

      // 2. Fetch current task state to avoid redundant moves
      const task = await this.prisma.task.findUnique({
        where: { id: input.taskId },
        select: { status: true, title: true },
      });

      if (!task || task.status === prediction.targetStatus) return;

      // 3. Execute Autonomous Transition
      await this.prisma.task.update({
        where: { id: input.taskId },
        data: { status: prediction.targetStatus },
      });

      // 4. Record Event
      await this.prisma.taskEvent.create({
        data: {
          taskId: input.taskId,
          actorId: input.authorId,
          type: 'status_changed',
          payload: {
            from: task.status,
            to: prediction.targetStatus,
            isAutonomous: true,
            reason: `AI detected intent: ${input.content.substring(0, 30)}...`,
          },
        },
      });

      // 5. Notify UI via Socket
      this.projectGateway.emitTaskUpdated({
        projectId: input.projectId,
        taskId: input.taskId,
        status: prediction.targetStatus,
      });

      logger.info(
        { taskId: input.taskId, targetStatus: prediction.targetStatus },
        'Autonomous workflow transition executed',
      );
    } catch (err: unknown) {
      logger.error({ err, taskId: input.taskId }, 'Autonomous transition failed');
    }
  }
}

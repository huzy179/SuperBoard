import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { AiService } from '../ai/ai.service';
import { logger } from '../../common/logger';
import type { TaskEventType } from '@prisma/client';

import { NeuralAgentService } from './neural-agent.service';

@Injectable()
export class AutomationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
    private aiService: AiService,
    private neuralAgentService: NeuralAgentService,
  ) {}

  async handleTaskEvent(event: {
    taskId: string;
    workspaceId: string;
    projectId: string;
    type: TaskEventType | 'created';
    actorId?: string | null;
    payload: Record<string, unknown>;
  }) {
    try {
      // 0. Persist Event for Neural Mission Timeline
      await this.prisma.taskEvent.create({
        data: {
          taskId: event.taskId,
          actorId: event.actorId ?? null,
          type: event.type === 'created' ? 'created' : (event.type as TaskEventType),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          payload: event.payload as any,
        },
      });

      // Trigger Neural Agents in background
      void this.neuralAgentService.processEvent(event);

      // Fetch active rules for this workspace/project
      const rules = await this.prisma.workflowRule.findMany({
        where: {
          workspaceId: event.workspaceId,
          isActive: true,
          OR: [{ projectId: null }, { projectId: event.projectId }],
        },
      });

      if (rules.length === 0) return;

      logger.info({ ruleCount: rules.length, taskId: event.taskId }, 'Evaluating automation rules');

      for (const rule of rules) {
        if (await this.matchesTrigger(rule.trigger, event)) {
          logger.info(
            { ruleId: rule.id, ruleName: rule.name },
            'Rule triggered! Executing actions...',
          );
          await this.executeActions(rule.actions, event);
        }
      }

      // Hardcoded Neural Automation: Cross-Project Blocker Resolution
      if (event.type === 'status_changed' && event.payload.to === 'done') {
        await this.checkBlockerResolutions(event.taskId, event.workspaceId);
      }
    } catch (err) {
      logger.error({ err, taskId: event.taskId }, 'Automation engine error');
    }
  }

  private async checkBlockerResolutions(taskId: string, workspaceId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        sourceLinks: {
          where: { type: 'blocks' },
          include: {
            targetTask: {
              select: {
                id: true,
                title: true,
                assigneeId: true,
                project: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    if (!task || task.sourceLinks.length === 0) return;

    for (const link of task.sourceLinks) {
      const target = link.targetTask;
      if (target.assigneeId) {
        await this.notificationService.createNotification({
          userId: target.assigneeId,
          workspaceId,
          type: 'task_updated',
          payload: {
            taskId: target.id,
            message: `Blocker resolved: "${task.title}" is now DONE. You can proceed with "${target.title}" in project ${target.project.name}.`,
          },
        });
      }
    }
  }

  private async matchesTrigger(trigger: unknown, event: Record<string, unknown>): Promise<boolean> {
    const typeMap: Record<string, string | undefined> = {
      TASK_CREATED: 'created',
      STATUS_CHANGED: 'status_changed',
      ASSIGNEE_CHANGED: 'assignee_changed',
    };

    const triggerObj = trigger as Record<string, unknown>;
    const eventObj = event as Record<string, unknown>;

    if (typeMap[triggerObj.type as string] !== eventObj.type) return false;

    // Additional config checks
    if (triggerObj.type === 'STATUS_CHANGED' && triggerObj.config) {
      const config = triggerObj.config as Record<string, unknown>;
      const payload = eventObj.payload as Record<string, unknown>;
      const { from, to } = config;
      if (from && payload.from !== from) return false;
      if (to && payload.to !== to) return false;
    }

    if (triggerObj.type === 'SEMANTIC_MATCH' && triggerObj.config) {
      const task = (eventObj.payload as { task?: { title: string; description: string } })?.task;
      if (!task) return false;

      // Use AI to check if task content matches semantic prompt
      const result = await this.aiService.processText(
        `Task: ${task.title}\nDesc: ${task.description}`,
        'semantic_compare',
      );
      return result === 'true';
    }

    return true;
  }

  private async executeActions(actions: unknown, event: Record<string, unknown>) {
    if (!Array.isArray(actions)) return;

    for (const action of actions as Array<Record<string, unknown>>) {
      try {
        switch (action.type as string) {
          case 'SEND_NOTIFICATION':
            await this.notificationService.createNotification({
              userId:
                ((action.config as Record<string, unknown>)?.userId as string) ||
                (event.actorId as string), // Default to actor if not specified
              workspaceId: event.workspaceId as string,
              type: 'automation_alert',
              payload: {
                taskId: event.taskId as string,
                message: this.interpolateTemplate(
                  (action.config as Record<string, unknown>)?.message as string,
                  event,
                ),
              },
            });
            break;

          case 'UPDATE_TASK_FIELD':
            await this.prisma.task.update({
              where: { id: event.taskId as string },
              data: (action.config as Record<string, unknown>).data as Record<string, unknown>,
            });
            break;

          case 'AUTO_ASSIGN':
            await this.prisma.task.update({
              where: { id: event.taskId as string },
              data: {
                assigneeId: (action.config as Record<string, unknown>)?.userId as string,
              },
            });
            break;

          case 'AI_EVALUATE': {
            const task = await this.prisma.task.findUnique({
              where: { id: event.taskId as string },
            });
            if (!task) break;

            const evaluation = await this.aiService.processText(
              `Task Title: ${task.title}\nDescription: ${task.description}`,
              'evaluate_automation_condition',
            );

            if (evaluation === 'false') {
              logger.warn(
                { taskId: event.taskId, ruleId: 'AI_GUARDRAIL' },
                'AI Guardrail triggered: evaluation failed. Halting rule.',
              );
              return; // Halt subsequent actions in this rule
            }
            break;
          }

          case 'SEND_WEBHOOK': {
            const webhookUrl = (action.config as Record<string, unknown>)?.url as string;
            if (webhookUrl) {
              // Fire and forget webhook
              fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: event.type,
                  taskId: event.taskId,
                  workspaceId: event.workspaceId,
                  payload: event.payload,
                }),
              }).catch((err) => logger.error({ err, webhookUrl }, 'Webhook failed'));
            }
            break;
          }

          default:
            logger.warn({ actionType: action.type }, 'Unknown action type');
        }
      } catch (err) {
        logger.error({ err, actionType: action.type }, 'Action execution failed');
      }
    }
  }

  private interpolateTemplate(template: string, event: Record<string, unknown>): string {
    if (!template) return '';
    // Simple interpolation for now: {{taskId}}, {{type}}
    return template
      .replace(/{{taskId}}/g, String(event.taskId))
      .replace(/{{type}}/g, String(event.type));
  }

  async generateRuleFromPrompt(prompt: string): Promise<Record<string, unknown>> {
    const rules = {
      name: 'AI Generated Rule',
      trigger: { type: 'STATUS_CHANGED', config: { to: 'done' } },
      actions: [{ type: 'SEND_NOTIFICATION', config: { message: 'Task {{taskId}} is done!' } }],
    };

    // In a real scenario, we would call this.aiService.generateAutomationRule(prompt)
    // For now, we return a high-quality template based on keyword detection to demonstrate "Elite" logic
    if (prompt.toLowerCase().includes('slack') || prompt.toLowerCase().includes('webhook')) {
      (rules.actions as Record<string, unknown>[]).push({
        type: 'SEND_WEBHOOK',
        config: { url: 'https://hooks.slack.com/services/...' },
      });
    }
    if (prompt.toLowerCase().includes('assign')) {
      (rules.actions as Record<string, unknown>[]).push({
        type: 'AUTO_ASSIGN',
        config: { userId: 'default-assignee-id' },
      });
    }

    return rules;
  }
}

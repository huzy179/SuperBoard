import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { logger } from '../../common/logger';
import type { TaskEventType } from '@prisma/client';

@Injectable()
export class AutomationService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async handleTaskEvent(event: {
    taskId: string;
    workspaceId: string;
    projectId: string;
    type: TaskEventType;
    actorId?: string | null;
    payload: Record<string, unknown>;
  }) {
    try {
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
        if (this.matchesTrigger(rule.trigger, event)) {
          logger.info(
            { ruleId: rule.id, ruleName: rule.name },
            'Rule triggered! Executing actions...',
          );
          await this.executeActions(rule.actions, event);
        }
      }
    } catch (err) {
      logger.error({ err, taskId: event.taskId }, 'Automation engine error');
    }
  }

  private matchesTrigger(trigger: unknown, event: Record<string, unknown>): boolean {
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
    return template.replace(/{{taskId}}/g, event.taskId).replace(/{{type}}/g, event.type);
  }
}

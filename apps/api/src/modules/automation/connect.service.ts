import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import axios from 'axios';

@Injectable()
export class ConnectService {
  private readonly logger = new Logger(ConnectService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getIntegrations(workspaceId: string) {
    return this.prisma.externalIntegration.findMany({
      where: { workspaceId },
    });
  }

  async createIntegration(workspaceId: string, data: Record<string, unknown>) {
    return this.prisma.externalIntegration.create({
      data: {
        ...data,
        workspaceId,
      },
    });
  }

  async deleteIntegration(id: string, workspaceId: string) {
    return this.prisma.externalIntegration.deleteMany({
      where: { id, workspaceId },
    });
  }

  /**
   * Dispatches a neural signal to an external provider (e.g., Slack)
   */
  async dispatchSignal(workspaceId: string, projectId: string, context: string) {
    const integrations = await this.prisma.externalIntegration.findMany({
      where: {
        workspaceId,
        projectId: { in: [projectId, null] },
        provider: 'SLACK',
        type: 'webhook_out',
      },
    });

    if (integrations.length === 0) return;

    // Neurally format the signal for Slack
    const slackMessage = await this.aiService.processText(
      `Context: ${context}\nFormat this as a professional, high-impact Slack block message for a project update.`,
      'format_slack_signal',
    );

    for (const integration of integrations) {
      const config = integration.config as { url: string };
      if (config.url) {
        try {
          await axios.post(config.url, { text: slackMessage });
          this.logger.log(`Signal dispatched to Slack: ${integration.name}`);
        } catch (err) {
          this.logger.error(`Failed to dispatch signal to Slack: ${integration.name}`, err);
          await this.prisma.externalIntegration.update({
            where: { id: integration.id },
            data: { status: 'error' },
          });
        }
      }
    }
  }

  /**
   * Processes an incoming signal (e.g., GitHub Commit)
   */
  async handleIncomingWebhook(provider: string, payload: Record<string, unknown>) {
    this.logger.log(`Incoming signal received from ${provider}`);

    // Logic to map external events to SuperBoard updates
    const interpretation = await this.aiService.processText(
      `Provider: ${provider}\nPayload: ${JSON.stringify(payload)}\nInterpret this as a project update. Suggest any task status changes or mission progress updates.`,
      'interpret_signal',
    );

    // Persist signal for RAG
    const integration = await this.prisma.externalIntegration.findFirst({
      where: { provider: provider.toUpperCase() as IntegrationProvider },
    });

    if (integration) {
      await this.prisma.signalLog.create({
        data: {
          workspaceId: integration.workspaceId,
          projectId: integration.projectId,
          integrationId: integration.id,
          provider: integration.provider,
          payload: payload as Prisma.InputJsonValue,
          interpretation,
        },
      });

      // In a real scenario, we'd trigger background embedding here
      this.logger.log(`Signal persisted for workspace ${integration.workspaceId}`);
    }

    this.logger.log(`Signal Interpretation: ${interpretation}`);

    return { status: 'processed', interpretation };
  }
}

import { Injectable, OnModuleDestroy, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { ReportService } from '../modules/project/report.service';
import { NeuralAgentService } from '../modules/automation/neural-agent.service';

@Injectable()
export class WorkerService implements OnModuleInit, OnModuleDestroy {
  private worker: Worker | null = null;
  private readonly queueName: string;
  private readonly enabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ReportService))
    private readonly reportService: ReportService,
    @Inject(forwardRef(() => NeuralAgentService))
    private readonly neuralAgentService: NeuralAgentService,
  ) {
    this.queueName = this.configService.get<string>('QUEUE_NAME') || 'superboard-dev';
    this.enabled = this.configService.get<boolean>('ENABLE_QUEUE') ?? false;
  }

  async onModuleInit(): Promise<void> {
    if (!this.enabled) return;

    const redisUrl = new URL(this.configService.getOrThrow<string>('REDIS_URL'));

    this.worker = new Worker(
      this.queueName,
      async (job: Job) => {
        try {
          await this.processJob(job);
        } catch (error) {
          console.error(`[WorkerService] Job ${job.id} [${job.name}] failed:`, error);
          throw error;
        }
      },
      {
        connection: {
          host: redisUrl.hostname,
          port: Number(redisUrl.port || 6379),
          username: redisUrl.username || undefined,
          password: redisUrl.password || undefined,
          db: redisUrl.pathname ? Number(redisUrl.pathname.slice(1) || 0) : 0,
        },
        concurrency: 5,
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[WorkerService] Job ${job.id} [${job.name}] completed successfully.`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.worker) {
      await this.worker.close();
    }
  }

  private async processJob(job: Job): Promise<void> {
    console.log(`[WorkerService] Processing job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case 'NEURAL_DAILY':
        await this.handleNeuralDailyJob();
        break;
      case 'AUDITOR_HEAL':
        await this.handleAuditorHealJob();
        break;
      case 'GENERATE_MEMOIR':
        await this.handleGenerateMemoirJob(job.data);
        break;
      default:
        console.warn(`[WorkerService] Unknown job type: ${job.name}`);
    }
  }

  private async handleNeuralDailyJob(): Promise<void> {
    const workspaces = await this.prisma.workspace.findMany();
    console.log(`[WorkerService] Generating Neural Daily for ${workspaces.length} workspaces...`);

    for (const workspace of workspaces) {
      try {
        await this.reportService.getNeuralDailyBriefing(workspace.id);
      } catch (e) {
        console.error(`[WorkerService] Failed daily briefing for workspace ${workspace.id}:`, e);
      }
    }
  }

  private async handleAuditorHealJob(): Promise<void> {
    const workspaces = await this.prisma.workspace.findMany();
    console.log(`[WorkerService] Running Auditor Heal for ${workspaces.length} workspaces...`);

    for (const workspace of workspaces) {
      try {
        await this.neuralAgentService.runAuditorAgent(workspace.id);
      } catch (e) {
        console.error(`[WorkerService] Failed auditor scan for workspace ${workspace.id}:`, e);
      }
    }
  }

  private async handleGenerateMemoirJob(data: Record<string, unknown>): Promise<void> {
    const { projectId } = data;
    if (!projectId) return;

    console.log(`[WorkerService] Generating dynamic Memoir for project ${projectId}...`);
    await this.reportService.generateProjectMemoir(projectId as string, 'executive');
  }
}

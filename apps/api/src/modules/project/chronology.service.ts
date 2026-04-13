import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  actor: string;
  time: string;
}

interface TimelinePulse {
  id: string;
  date: string;
  intensity: number;
  narrative: string;
  events: TimelineEvent[];
}

@Injectable()
export class ChronologyService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async getProjectTimeline(projectId: string): Promise<TimelinePulse[]> {
    const events = await this.prisma.taskEvent.findMany({
      where: {
        task: { projectId },
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        task: {
          select: { title: true, status: true },
        },
        actor: {
          select: { name: true },
        },
      },
    });

    // Group events by day
    const grouped = events.reduce(
      (acc, event) => {
        const day = format(event.createdAt, 'yyyy-MM-dd');
        if (!acc[day]) acc[day] = [];
        acc[day].push(event);
        return acc;
      },
      {} as Record<string, typeof events>,
    );

    const pulses: TimelinePulse[] = [];

    for (const [day, dayEvents] of Object.entries(grouped)) {
      const narrative = await this.generatePulseNarrative(dayEvents);

      pulses.push({
        id: `pulse-${day}`,
        date: day,
        intensity: Math.min(dayEvents.length / 10, 1), // Intensity 0-1 based on activity
        narrative,
        events: dayEvents.map((e) => ({
          id: e.id,
          type: e.type,
          title: e.task.title,
          actor: e.actor?.name || 'Automated System',
          time: format(e.createdAt, 'HH:mm'),
        })),
      });
    }

    return pulses;
  }

  private async generatePulseNarrative(events: unknown[]): Promise<string> {
    const typedEvents = events as ((typeof events)[0] & {
      actor: { name: string };
      task: { title: string };
      type: string;
    })[];
    try {
      const eventSummary = typedEvents
        .slice(0, 5)
        .map((e) => `${e.actor?.name || 'System'} ${e.type} task "${e.task.title}"`)
        .join('\n');

      const context = `Chronology Activity:\n${eventSummary}`;

      // We'll add a new persona for chronology narrativa
      const narrative = await this.aiService.processText(context, 'mission_chronology_synthesizer');
      return narrative;
    } catch {
      return 'Operational alignment and tactical convergence recorded.';
    }
  }
}

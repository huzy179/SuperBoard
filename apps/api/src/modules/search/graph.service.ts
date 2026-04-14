import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { NeuralGraphDTO, NeuralNodeDTO, NeuralEdgeDTO } from '@superboard/shared';
import { logger } from '../../common/logger';

@Injectable()
export class GraphService {
  constructor(private prisma: PrismaService) {}

  async getNeuralGraph(projectId: string): Promise<NeuralGraphDTO> {
    try {
      // 1. Fetch Nodes (Tasks)
      const tasks = await this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          type: true,
        },
      });

      // 2. Fetch Nodes (Docs)
      const docs = await this.prisma.doc.findMany({
        where: { projectId, deletedAt: null },
        select: {
          id: true,
          title: true,
        },
      });

      const nodes: NeuralNodeDTO[] = [
        ...tasks.map((t) => ({
          id: t.id,
          label: t.title,
          type: 'task' as const,
          category: t.status,
          priority: t.priority,
        })),
        ...docs.map((d) => ({
          id: d.id,
          label: d.title,
          type: 'doc' as const,
        })),
      ];

      // 3. Resolve Similarity Links (Performance Warning: O(N^2) for large projects)
      // In a production scenario, we would use a vector database's native similarity batch query
      // For SuperBoard Elite, we execute a similarity discovery query for Tasks and Docs
      const links: NeuralEdgeDTO[] = [];

      // Link Task-to-Task
      const taskSimilarity = await this.prisma.$queryRaw<
        { source: string; target: string; score: number }[]
      >`
        SELECT te1."taskId" as source, te2."taskId" as target, 
               (1 - (te1.vector <=> te2.vector)) as score
        FROM "TaskEmbedding" te1
        JOIN "Task" t1 ON te1."taskId" = t1.id
        JOIN "TaskEmbedding" te2 ON te1."taskId" < te2."taskId"
        JOIN "Task" t2 ON te2."taskId" = t2.id
        WHERE t1."projectId" = ${projectId} AND t2."projectId" = ${projectId}
          AND (1 - (te1.vector <=> te2.vector)) > 0.85
        LIMIT 100;
      `;

      links.push(
        ...taskSimilarity.map((s) => ({
          source: s.source,
          target: s.target,
          score: Number(s.score),
          type: 'semantic_similarity' as const,
        })),
      );

      // Link Task-to-Doc (Cross-Vector relations)
      const crossSimilarity = await this.prisma.$queryRaw<
        { source: string; target: string; score: number }[]
      >`
        SELECT te."taskId" as source, de."docId" as target,
               (1 - (te.vector <=> de.vector)) as score
        FROM "TaskEmbedding" te
        JOIN "Task" t ON te."taskId" = t.id
        JOIN "DocEmbedding" de ON TRUE
        JOIN "Doc" d ON de."docId" = d.id
        WHERE t."projectId" = ${projectId}
          AND (1 - (te.vector <=> de.vector)) > 0.88
        LIMIT 50;
      `;

      links.push(
        ...crossSimilarity.map((s) => ({
          source: s.source,
          target: s.target,
          score: Number(s.score),
          type: 'semantic_similarity' as const,
        })),
      );

      return { nodes, links };
    } catch (err) {
      logger.error({ err, projectId }, 'Failed to generate neural graph');
      return { nodes: [], links: [] };
    }
  }
}

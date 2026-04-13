import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SearchService } from '../search/search.service';

interface GraphNode {
  id: string;
  type: 'task' | 'doc' | 'user';
  label: string;
  metadata?: Record<string, unknown>;
}

interface GraphEdge {
  from: string;
  to: string;
  type: string;
  strength?: number;
}

@Injectable()
export class GraphService {
  constructor(
    private prisma: PrismaService,
    private searchService: SearchService,
  ) {}

  async getProjectGraph(projectId: string) {
    const [tasks, docs] = await Promise.all([
      this.prisma.task.findMany({
        where: { projectId, deletedAt: null },
        include: { assignee: true, taskLinks: true },
      }),
      this.prisma.doc.findMany({
        where: { projectId, deletedAt: null },
      }),
    ]);

    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const userIds = new Set<string>();

    // Add Task Nodes & Assignment Edges
    tasks.forEach((task) => {
      nodes.push({
        id: task.id,
        type: 'task',
        label: task.title,
        metadata: { status: task.status, priority: task.priority },
      });

      if (task.assigneeId) {
        userIds.add(task.assigneeId);
        edges.push({ from: task.id, to: task.assigneeId, type: 'assigned_to' });
      }

      // Add Doc Links
      task.taskLinks.forEach((link) => {
        edges.push({
          from: task.id,
          to: link.docId,
          type: 'linked_to',
          strength: link.strength,
        });
      });
    });

    // Add Doc Nodes
    docs.forEach((doc) => {
      nodes.push({
        id: doc.id,
        type: 'doc',
        label: doc.title,
        metadata: { authorId: doc.createdById },
      });
      userIds.add(doc.createdById);
      edges.push({ from: doc.id, to: doc.createdById, type: 'authored_by' });
    });

    // Hydrate User Nodes
    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true, avatarUrl: true },
    });

    users.forEach((user) => {
      nodes.push({
        id: user.id,
        type: 'user',
        label: user.fullName,
        metadata: { avatarUrl: user.avatarUrl },
      });
    });

    return { nodes, edges };
  }

  async suggestLinks(docId: string) {
    const doc = await this.prisma.doc.findUnique({
      where: { id: docId },
      select: { title: true, content: true, workspaceId: true },
    });

    if (!doc) return [];

    const query = `${doc.title} ${JSON.stringify(doc.content)}`;
    // Search for semantically related tasks
    const relevantTasks = await this.searchService.globalSearch(doc.workspaceId, query);

    return relevantTasks.tasks.slice(0, 5).map((task) => ({
      taskId: task.id,
      title: task.title,
      confidence: 0.8, // In a real scenario, we'd use the vector distance
    }));
  }
}

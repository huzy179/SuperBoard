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

  async getGlobalVectorAtlas(workspaceId: string) {
    const [docs, tasks] = await Promise.all([
      this.prisma.doc.findMany({
        where: { workspaceId, deletedAt: null },
        include: { project: true },
      }),
      this.prisma.task.findMany({
        where: { projectId: { not: null }, deletedAt: null },
        include: { project: true },
      }),
    ]);

    const nodes: (GraphNode & { group: string; projectName: string })[] = [];
    const edges: GraphEdge[] = [];

    // 1. Map all docs and tasks as nodes
    docs.forEach((doc) => {
      nodes.push({
        id: doc.id,
        type: 'doc',
        label: doc.title,
        group: doc.projectId || 'unassigned',
        projectName: doc.project?.name || 'Workspace Core',
      });
    });

    tasks.forEach((task) => {
      nodes.push({
        id: task.id,
        type: 'task',
        label: task.title,
        group: task.projectId!,
        projectName: task.project?.name || 'Unknown',
      });
    });

    // 2. Compute Semantic Edges (Simplified for Demo Atlas)
    // In a production system, we'd use vector clustering (K-Means/DBSCAN)
    // Here we use semantic adjacency: if nodes share core keywords / common context
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // Heuristic for semantic similarity:
        // - Same keywords in titles
        // - Shared metadata context
        const similarity = this.calculateHeuristicSimilarity(nodeA.label, nodeB.label);

        if (similarity > 0.6) {
          edges.push({
            from: nodeA.id,
            to: nodeB.id,
            type: 'semantic_link',
            strength: similarity,
          });
        }
      }
    }

    return { nodes, edges };
  }

  private calculateHeuristicSimilarity(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(' '));
    const wordsB = new Set(b.toLowerCase().split(' '));
    const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));

    // Filter out stop words for better clustering
    const stopWords = new Set(['the', 'a', 'to', 'for', 'in', 'on', 'with', 'and']);
    const meaningfulWords = Array.from(intersection).filter((w) => !stopWords.has(w));

    if (meaningfulWords.length >= 2) return 0.9;
    if (meaningfulWords.length >= 1) return 0.7;
    return 0;
  }
}

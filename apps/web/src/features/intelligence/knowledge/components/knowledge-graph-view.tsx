'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Database, Users, FileText, RefreshCw } from 'lucide-react';
import { getKnowledgeGraph, type KnowledgeGraphData } from '../api/knowledge-service';

interface Node {
  id: string;
  type: 'task' | 'doc' | 'user';
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

export function KnowledgeGraphView({
  projectId,
  onSelectNode,
}: {
  projectId: string;
  onSelectNode?:
    | ((nodeId: string, type: 'task' | 'doc' | 'user', label: string) => void)
    | undefined;
}) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef<number>(0);
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = (await getKnowledgeGraph(projectId)) as KnowledgeGraphData;

      const initialNodes = data.nodes.map((n) => ({
        ...n,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
      }));

      setNodes(initialNodes);
      setEdges(data.edges);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchData());
  }, [fetchData]);

  // Force-directed simulation logic
  const animate = useCallback(() => {
    const tick = () => {
      setNodes((prevNodes) => {
        const nextNodes = [...prevNodes];

        // Forces
        for (let i = 0; i < nextNodes.length; i++) {
          const nodeA = nextNodes[i];
          if (!nodeA) continue;

          // Repulsion
          for (let j = i + 1; j < nextNodes.length; j++) {
            const nodeB = nextNodes[j];
            if (!nodeB) continue;

            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 1000 / (dist * dist);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;
          }

          // Attraction to center
          const centerX = 400;
          const centerY = 300;
          nodeA.vx += (centerX - nodeA.x) * 0.01;
          nodeA.vy += (centerY - nodeA.y) * 0.01;

          // Friction
          nodeA.vx *= 0.9;
          nodeA.vy *= 0.9;

          // Boundaries
          nodeA.x += nodeA.vx;
          nodeA.y += nodeA.vy;
        }

        // Edge attraction
        edges.forEach((edge) => {
          const from = nextNodes.find((n) => n?.id === edge.from);
          const to = nextNodes.find((n) => n?.id === edge.to);
          if (from && to) {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - 150) * 0.05;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            from.vx += fx;
            from.vy += fy;
            to.vx -= fx;
            to.vy -= fy;
          }
        });

        return nextNodes;
      });
      requestRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [edges]);

  useEffect(() => {
    if (nodes.length > 0) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes.length, animate]);

  return (
    <div className="relative w-full h-[600px] rounded-xl border border-surface-border bg-surface-card overflow-hidden shadow-luxe">
      {/* UI Overlay */}
      <div className="absolute top-6 left-6 z-20 space-y-1">
        <h3 className="text-lg font-semibold text-[color:var(--color-ink)]">Bản đồ kiến thức</h3>
        <p className="text-sm text-[color:var(--color-muted)]">
          Tương quan giữa task, tài liệu và thành viên.
        </p>
      </div>

      <div className="absolute top-6 right-6 z-20 flex gap-3">
        <button
          onClick={fetchData}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <div className="text-sm text-[color:var(--color-muted)]">Đang tải dữ liệu…</div>
        </div>
      ) : (
        <div className="relative w-full h-full">
          {edges.map((edge, i) => {
            const from = nodes.find((n) => n.id === edge.from);
            const to = nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;
            return (
              <div
                key={`${edge.from}-${edge.to}-${i}`}
                className="absolute h-px bg-black/[0.07] origin-left pointer-events-none"
                style={{
                  width: Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2),
                  left: from.x,
                  top: from.y,
                  transform: `rotate(${Math.atan2(to.y - from.y, to.x - from.x)}rad)`,
                }}
              />
            );
          })}

          {nodes.map((node) => (
            <div
              key={node.id}
              onClick={() => onSelectNode?.(node.id, node.type, node.label)}
              className="absolute group/node cursor-pointer"
              style={{
                left: node.id === 'center' ? 400 : node.x,
                top: node.id === 'center' ? 300 : node.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`p-3 rounded-lg border transition-colors shadow-sm hover:z-30 ${
                  node.type === 'task'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : node.type === 'doc'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {node.type === 'task' ? (
                  <Database size={16} />
                ) : node.type === 'doc' ? (
                  <FileText size={16} />
                ) : (
                  <Users size={16} />
                )}
              </div>
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-opacity bg-surface-card px-3 py-1 rounded-md border border-surface-border shadow-sm pointer-events-none">
                <span className="text-xs font-medium text-[color:var(--color-ink)]">
                  {node.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-6 z-20 flex flex-wrap gap-5 rounded-md border border-surface-border bg-surface-bg px-3 py-2 shadow-sm">
        <LegendItem icon={<Database size={12} />} label="Công việc" color="text-indigo-700" />
        <LegendItem icon={<FileText size={12} />} label="Tri thức" color="text-emerald-700" />
        <LegendItem icon={<Users size={12} />} label="Thành viên" color="text-rose-700" />
      </div>
    </div>
  );
}

function LegendItem({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${color}`}>{icon}</div>
      <span className="text-xs font-medium text-[color:var(--color-muted)]">{label}</span>
    </div>
  );
}

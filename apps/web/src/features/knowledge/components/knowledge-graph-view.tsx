'use client';

import { useState, useEffect, useRef } from 'react';
import { Database, Users, FileText, RefreshCw, Zap } from 'lucide-react';

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

export function KnowledgeGraphView({ projectId }: { projectId: string }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const requestRef = useRef<number>(0);
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/knowledge/graph/${projectId}`);
      const body = await res.json();

      const initialNodes = body.data.nodes.map((n: Record<string, unknown>) => ({
        ...n,
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: 0,
        vy: 0,
      }));

      setNodes(initialNodes);
      setEdges(body.data.edges);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Force-directed simulation logic
  const animate = () => {
    setNodes((prevNodes) => {
      const nextNodes = [...prevNodes];

      // Forces
      for (let i = 0; i < nextNodes.length; i++) {
        const nodeA = nextNodes[i];

        // Repulsion
        for (let j = i + 1; j < nextNodes.length; j++) {
          const nodeB = nextNodes[j];
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
        const from = nextNodes.find((n) => n.id === edge.from);
        const to = nextNodes.find((n) => n.id === edge.to);
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
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (nodes.length > 0) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes.length]);

  return (
    <div className="relative w-full h-[600px] bg-slate-950 rounded-[3rem] border border-white/5 overflow-hidden shadow-luxe group">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500/5 via-transparent to-transparent opacity-50" />

      {/* UI Overlay */}
      <div className="absolute top-10 left-10 z-20 space-y-2">
        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none">
          Neural Knowledge Graph
        </h3>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">
          Project Semantic Map
        </p>
      </div>

      <div className="absolute top-10 right-10 z-20 flex gap-4">
        <button
          onClick={fetchData}
          className="p-4 rounded-3xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all shadow-luxe border border-white/5"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Zap className="animate-pulse text-brand-400" size={48} />
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
                className="absolute h-px bg-white/5 origin-left pointer-events-none"
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
              className="absolute group/node cursor-pointer"
              style={{
                left: node.id === 'center' ? 400 : node.x,
                top: node.id === 'center' ? 300 : node.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`p-4 rounded-2xl border transition-all duration-500 shadow-luxe hover:scale-125 hover:z-30 ${
                  node.type === 'task'
                    ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                    : node.type === 'doc'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
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
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover/node:opacity-100 transition-opacity bg-slate-900 px-3 py-1 rounded-lg border border-white/10 shadow-glass pointer-events-none">
                <span className="text-[10px] font-black text-white uppercase tracking-wider">
                  {node.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-10 left-10 z-20 flex gap-8">
        <LegendItem icon={<Database size={12} />} label="Missions" color="text-indigo-400" />
        <LegendItem icon={<FileText size={12} />} label="Intelligence" color="text-emerald-400" />
        <LegendItem icon={<Users size={12} />} label="Operators" color="text-rose-400" />
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
      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}

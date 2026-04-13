'use client';

import { useState, useEffect, useRef } from 'react';
import { Zap, X, MousePointer2, Activity } from 'lucide-react';
import type { NeuralGraphDTO, NeuralNodeDTO } from '@superboard/shared';

interface KnowledgeMapProps {
  projectId: string;
  onClose: () => void;
  onSelectNode: (node: NeuralNodeDTO) => void;
}

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function KnowledgeMap({ projectId, onClose, onSelectNode }: KnowledgeMapProps) {
  const [graph, setGraph] = useState<NeuralGraphDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [nodes, setNodes] = useState<(NeuralNodeDTO & Point)[]>([]);
  const containerRef = useRef<SVGSVGElement>(null);
  const [viewBox] = useState('0 0 1000 1000');

  // Simulation Constants
  const REPULSION = 5000;
  const ATTRACTION = 0.05;
  const CENTER_PULL = 0.01;
  const DAMPING = 0.95;

  useEffect(() => {
    fetchGraph();
  }, [projectId]);

  const fetchGraph = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/search/graph/${projectId}`);
      const data = await res.json();
      const rawGraph = data.data as NeuralGraphDTO;
      setGraph(rawGraph);

      // Initialize positions
      const initialNodes = rawGraph.nodes.map((n, i) => ({
        ...n,
        x: 500 + Math.cos(i) * 200,
        y: 500 + Math.sin(i) * 200,
        vx: 0,
        vy: 0,
      }));
      setNodes(initialNodes);
    } catch (err) {
      console.error('Failed to fetch neural graph', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Force-Directed Logic
  useEffect(() => {
    if (nodes.length === 0 || !graph) return;

    let frameId: number;
    const iterate = () => {
      setNodes((prev) => {
        const nextNodes = prev.map((n) => ({ ...n }));

        // 1. Repulsion (between all nodes)
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const distSq = dx * dx + dy * dy + 0.1;
            const force = REPULSION / distSq;
            const fx = (dx / Math.sqrt(distSq)) * force;
            const fy = (dy / Math.sqrt(distSq)) * force;

            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
          }
        }

        // 2. Attraction (along links)
        graph.links.forEach((link) => {
          const s = nextNodes.find((n) => n.id === link.source);
          const t = nextNodes.find((n) => n.id === link.target);
          if (!s || !t) return;

          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const force = dist * ATTRACTION * link.score;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          s.vx += fx;
          s.vy += fy;
          t.vx -= fx;
          t.vy -= fy;
        });

        // 3. Center Pull & Update
        return nextNodes.map((n) => {
          const dx = 500 - n.x;
          const dy = 500 - n.y;
          n.vx += dx * CENTER_PULL;
          n.vy += dy * CENTER_PULL;

          n.vx *= DAMPING;
          n.vy *= DAMPING;

          return {
            ...n,
            x: n.x + n.vx,
            y: n.y + n.vy,
          };
        });
      });
      frameId = requestAnimationFrame(iterate);
    };

    frameId = requestAnimationFrame(iterate);
    return () => cancelAnimationFrame(frameId);
  }, [graph === null, nodes.length === 0]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-[200] flex flex-col animate-in fade-in duration-700 font-sans">
      <div className="p-8 border-b border-white/5 flex items-center justify-between backdrop-blur-3xl bg-black/40">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-glow-brand">
            <Activity size={24} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              Neural Knowledge Map
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">
                Project Semantic Ecosystem
              </span>
              <div className="h-1 w-1 bg-white/10 rounded-full" />
              <span className="text-[9px] font-bold text-brand-500/60 uppercase tracking-widest leading-none">
                V4.2 CORE_RELATIONS
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="px-5 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-brand-500 shadow-glow-brand" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                Tasks: {nodes.filter((n) => n.type === 'task').length}
              </span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
              <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                Docs: {nodes.filter((n) => n.type === 'doc').length}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 rounded-[1.25rem] bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/5 hover:border-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_#0f172a_0%,_#020617_100%)]">
        {/* Grid Background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />

        <svg
          ref={containerRef}
          viewBox={viewBox}
          className="w-full h-full cursor-grab active:cursor-grabbing transition-opacity duration-1000"
          style={{ opacity: isLoading ? 0 : 1 }}
        >
          {/* Defs for Glows */}
          <defs>
            <filter id="glow-node">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="edge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,255,255,0)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Links */}
          <g>
            {graph?.links.map((link, i) => {
              const s = nodes.find((n) => n.id === link.source);
              const t = nodes.find((n) => n.id === link.target);
              if (!s || !t) return null;
              return (
                <line
                  key={`${link.source}-${link.target}-${i}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke="url(#edge-grad)"
                  strokeWidth={2 * link.score}
                  strokeDasharray="4 2"
                  className="animate-pulse"
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                className="cursor-pointer group"
                onClick={() => onSelectNode(node)}
              >
                {/* Node Aura */}
                <circle
                  r={node.type === 'task' ? 24 : 18}
                  className={`opacity-0 group-hover:opacity-40 transition-all duration-500 blur-xl ${
                    node.type === 'task' ? 'fill-brand-500' : 'fill-emerald-500'
                  }`}
                />

                {/* Main Shape */}
                <circle
                  r={node.type === 'task' ? 12 : 8}
                  className={`transition-all duration-500 border border-white/20 ${
                    node.type === 'task'
                      ? 'fill-brand-500 shadow-glow-brand'
                      : 'fill-emerald-500 shadow-glow-emerald'
                  }`}
                  filter="url(#glow-node)"
                />

                {/* Info Text */}
                <g className="opacity-40 group-hover:opacity-100 transition-opacity duration-300">
                  <text
                    y={node.type === 'task' ? 32 : 28}
                    textAnchor="middle"
                    className="text-[10px] font-black fill-white uppercase tracking-widest pointer-events-none"
                    style={{ textShadow: '0 0 10px rgba(0,0,0,0.8)' }}
                  >
                    {node.label}
                  </text>
                  <text
                    y={node.type === 'task' ? 44 : 40}
                    textAnchor="middle"
                    className={`text-[8px] font-bold uppercase tracking-[0.2em] pointer-events-none ${
                      node.type === 'task' ? 'fill-brand-400' : 'fill-emerald-400'
                    }`}
                  >
                    {node.type === 'task' ? node.category || 'MISSION' : 'KNOWLEDGE'}
                  </text>
                </g>
              </g>
            ))}
          </g>
        </svg>

        {/* Legend / Overlay */}
        <div className="absolute bottom-10 left-10 p-6 rounded-[2.5rem] bg-black/60 border border-white/5 backdrop-blur-3xl space-y-4">
          <div className="flex items-center gap-3">
            <MousePointer2 size={12} className="text-white/20" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
              Protocol: Interactive Exploration
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-medium text-white/30 uppercase leading-relaxed max-w-xs">
              This map visualizes the project's semantic density. Neural links are established
              between vectors with {'>'}85% context similarity.
            </p>
          </div>
        </div>

        {/* HUD Elements */}
        <div className="absolute inset-0 pointer-events-none border-[40px] border-white/[0.01] rounded-full" />
      </div>

      <div className="p-8 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap size={10} className="text-brand-400" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
            Vector Physics Engine Active
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
            Layout: Custom Force-Directed SVG Runtime
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, BrainCircuit, Zap, ChevronRight, Database, Layers, Activity } from 'lucide-react';

interface AtlasNode {
  id: string;
  label: string;
  type: 'doc' | 'task';
  group: string;
  projectName: string;
}

interface AtlasEdge {
  from: string;
  to: string;
  strength: number;
}

export function VectorAtlas() {
  const [data, setData] = useState<{ nodes: AtlasNode[]; edges: AtlasEdge[] } | null>(null);
  const [diagnosis, setDiagnosis] = useState<{
    diagnosis: string;
    recommendations: string[];
  } | null>(null);
  const [selectedNode, setSelectedNode] = useState<AtlasNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/knowledge/atlas').then((res) => res.json()),
      fetch('/api/v1/knowledge/diagnosis').then((res) => res.json()),
    ])
      .then(([atlasRes, diagRes]) => {
        setData(atlasRes.data);
        setDiagnosis(diagRes.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading) return <AtlasSkeleton />;

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      {/* Neural Constellation Map */}
      <div className="xl:col-span-2 relative aspect-square md:aspect-video rounded-[3rem] border border-white/5 bg-slate-950 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.05),transparent_70%)]" />

        {/* Connection Arcs */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
          {data?.edges.map((edge, i) => {
            const from = data.nodes.find((n) => n.id === edge.from);
            const to = data.nodes.find((n) => n.id === edge.to);
            if (!from || !to) return null;

            // Fixed positions for demo constellations
            const fromPos = getNodePosition(from.id, data.nodes.length);
            const toPos = getNodePosition(to.id, data.nodes.length);

            return (
              <motion.line
                key={`edge-${i}`}
                x1={`${fromPos.x}%`}
                y1={`${fromPos.y}%`}
                x2={`${toPos.x}%`}
                y2={`${toPos.y}%`}
                stroke="url(#pulse-gradient)"
                strokeWidth={edge.strength * 2}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ duration: 2, delay: i * 0.05 }}
              />
            );
          })}
          <defs>
            <linearGradient id="pulse-gradient" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
              <stop offset="50%" stopColor="#818cf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Conceptual Nodes */}
        <div className="absolute inset-0">
          {data?.nodes.map((node) => {
            const pos = getNodePosition(node.id);
            return (
              <NodeElement
                key={node.id}
                node={node}
                pos={pos}
                isSelected={selectedNode?.id === node.id}
                onClick={() => setSelectedNode(node)}
              />
            );
          })}
        </div>

        {/* Atlas Legend / UI Overlay */}
        <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-6 px-6 py-3 bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-2xl pointer-events-auto">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-brand-500 shadow-glow-brand" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                Active Synthesis
              </span>
            </div>
            <div className="h-4 w-px bg-white/10" />
            <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold">
              <Network className="h-3 w-3" />
              <span>{data?.edges.length} Semantic Arcs</span>
            </div>
          </div>

          <div className="p-4 bg-brand-500 rounded-2xl shadow-glow-brand pointer-events-auto cursor-help group relative">
            <BrainCircuit className="h-5 w-5 text-white" />
            <div className="absolute bottom-full right-0 mb-4 w-64 p-4 bg-slate-900 border border-white/10 rounded-2xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none backdrop-blur-3xl shadow-2xl">
              <p className="text-[10px] font-bold text-white/60 leading-relaxed uppercase tracking-widest">
                Orbital nodes represent missions and protocols. Convergent paths indicate high
                semantic similarity and shared conceptual DNA.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Intelligence Sidebar */}
      <div className="space-y-8 h-full">
        {/* Focus Sentinel */}
        <div className="rounded-[2.5rem] border border-white/5 bg-white/[0.01] p-8 backdrop-blur-3xl space-y-8 animate-in slide-in-from-right duration-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-brand-400" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">
                Knowledge Health
              </h2>
            </div>
            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">
                Nominal
              </span>
            </div>
          </div>

          <p className="text-[11px] font-bold text-white/40 leading-relaxed uppercase tracking-widest italic border-l-2 border-brand-500/30 pl-4">
            {diagnosis?.diagnosis || 'Performing deep semantic scan of workspace nodes...'}
          </p>

          <div className="space-y-4 pt-4">
            {diagnosis?.recommendations?.map((rec: string, i: number) => (
              <div
                key={i}
                className="flex items-start gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-brand-500/20 transition-all"
              >
                <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400 group-hover:scale-110 transition-transform">
                  <Zap className="h-3 w-3" />
                </div>
                <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-loose">
                  {rec}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Node Detail Inspector */}
        {selectedNode && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-[2.5rem] border border-brand-500/20 bg-brand-500/[0.02] p-8 backdrop-blur-3xl space-y-6"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-brand-400 uppercase tracking-[0.3em]">
                    {selectedNode.type.toUpperCase()} TELEMETRY
                  </span>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                    {selectedNode.label}
                  </h3>
                </div>
                <div
                  className={`p-3 rounded-2xl ${selectedNode.type === 'doc' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/20'} border`}
                >
                  {selectedNode.type === 'doc' ? <Layers size={18} /> : <Database size={18} />}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <span className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                    Sector
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {selectedNode.projectName}
                  </span>
                </div>
                <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
                  <span className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                    Density
                  </span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                    Normal
                  </span>
                </div>
              </div>

              <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.4em] hover:bg-white/10 transition-all flex items-center justify-center gap-2 group">
                Enter Node Stream
                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function NodeElement({
  node,
  pos,
  isSelected,
  onClick,
}: {
  node: AtlasNode;
  pos: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.2, zIndex: 50 }}
      className="absolute group"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
    >
      <div className={`relative flex items-center justify-center transition-all duration-500`}>
        {/* Glow Halo */}
        <div
          className={`absolute -inset-4 rounded-full blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 ${node.type === 'doc' ? 'bg-indigo-500' : 'bg-brand-500'}`}
        />

        {/* Main Node */}
        <div
          className={`
          relative w-4 h-4 rounded-full border-2 shadow-2xl transition-all duration-500
          ${isSelected ? 'scale-150 border-white bg-white shadow-glow-current ring-4 ring-brand-500/20' : node.type === 'doc' ? 'border-indigo-400/50 bg-indigo-500/20' : 'border-brand-400/50 bg-brand-500/20'}
        `}
        />

        {/* Semantic Label */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none translate-y-2 group-hover:translate-y-0">
          <div className="bg-slate-900/90 border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2">
            <span className="text-[8px] font-black text-white uppercase tracking-widest">
              {node.label}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function getNodePosition(id: string) {
  // Deterministic orbital position based on ID string hash
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Center at 50, 50, radius 30-40%
  const angle = (hash % 360) * (Math.PI / 180);
  const radius = 15 + (Math.abs(hash) % 30);

  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

function AtlasSkeleton() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-pulse">
      <div className="xl:col-span-2 aspect-video bg-white/5 rounded-[3rem]" />
      <div className="space-y-8">
        <div className="h-96 bg-white/5 rounded-[3rem]" />
        <div className="h-64 bg-white/5 rounded-[3rem]" />
      </div>
    </div>
  );
}

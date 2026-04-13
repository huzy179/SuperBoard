'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  Zap,
  ArrowRightLeft,
  Link as LinkIcon,
  RefreshCcw,
  CheckCircle2,
  FileText,
  Briefcase,
} from 'lucide-react';

interface CollisionNode {
  id: string;
  type: 'task' | 'doc';
  title: string;
  projectName: string;
}

interface StrategicCollision {
  id: string;
  intensity: number;
  protocol: string;
  nodes: CollisionNode[];
}

export function ConflictResolver() {
  const [collisions, setCollisions] = useState<StrategicCollision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/v1/knowledge/diagnosis/divergence')
      .then((res) => res.json())
      .then((res) => {
        setCollisions(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const handleResolve = (id: string) => {
    setResolvedIds((prev) => new Set([...prev, id]));
  };

  if (isLoading) return <ResolverSkeleton />;

  return (
    <div className="space-y-12 py-10">
      <div className="flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-glow-red/10">
            <ShieldAlert className="h-5 w-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Strategic Divergence Audit
            </h2>
            <p className="text-sm font-bold text-white uppercase tracking-tight italic">
              Detecting Semantic Collisions
            </p>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
          <RefreshCcw size={14} className="text-white/40 animate-spin-slow" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
            {collisions.length} Collisions Active
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-6">
        <AnimatePresence mode="popLayout">
          {collisions.map((collision, idx) => {
            if (resolvedIds.has(collision.id)) return null;

            return (
              <motion.div
                key={collision.id}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.1 }}
                className="group relative h-full flex flex-col p-8 rounded-[3rem] border border-white/10 bg-slate-900/50 backdrop-blur-3xl hover:border-brand-500/40 transition-all duration-700 overflow-hidden"
              >
                {/* Collision Glow */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-red-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="flex items-center justify-between mb-8">
                  <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full flex items-center gap-2">
                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                      Collision Intensity: {(collision.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <Zap className="text-brand-500 h-4 w-4" />
                </div>

                <div className="flex items-center gap-4 mb-10">
                  <CollisionNodeCard node={collision.nodes[0]} />
                  <div className="flex-shrink-0 p-3 bg-white/5 rounded-full border border-white/10 relative">
                    <ArrowRightLeft className="text-white/40 h-4 w-4" />
                    <div className="absolute inset-0 animate-ping rounded-full border border-red-500/20 opacity-20" />
                  </div>
                  <CollisionNodeCard node={collision.nodes[1]} />
                </div>

                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                      AI Resolution Protocol
                    </span>
                    <p className="text-sm font-bold text-white uppercase tracking-tight leading-relaxed italic border-l-4 border-brand-500 pl-6 py-2">
                      "{collision.protocol}"
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex gap-3">
                  <button
                    onClick={() => handleResolve(collision.id)}
                    className="flex-1 px-6 py-4 bg-brand-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-glow-brand hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <LinkIcon size={14} /> Link Protocols
                  </button>
                  <button
                    onClick={() => handleResolve(collision.id)}
                    className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Ignore
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {collisions.length > 0 && resolvedIds.size === collisions.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-2 flex flex-col items-center justify-center py-20 text-center space-y-6"
          >
            <div className="p-6 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-glow-emerald/10">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                Workspace Aligned
              </h3>
              <p className="text-sm text-white/40 italic font-medium">
                All semantic collisions resolved. Zero mission divergence detected.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function CollisionNodeCard({ node }: { node: CollisionNode }) {
  return (
    <div className="flex-1 p-5 bg-white/[0.03] border border-white/5 rounded-3xl space-y-3 hover:bg-white/[0.06] transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-brand-500/10 rounded-lg text-brand-400">
          {node.type === 'task' ? <Briefcase size={14} /> : <FileText size={14} />}
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          {node.projectName}
        </span>
      </div>
      <p className="text-[11px] font-bold text-white uppercase tracking-tight text-wrap line-clamp-2 leading-tight">
        {node.title}
      </p>
    </div>
  );
}

function ResolverSkeleton() {
  return (
    <div className="space-y-12 py-10 px-6 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-96 bg-white/5 rounded-[3.5rem]" />
        <div className="h-96 bg-white/5 rounded-[3.5rem]" />
      </div>
    </div>
  );
}

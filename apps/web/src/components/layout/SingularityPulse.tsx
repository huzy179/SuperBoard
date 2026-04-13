'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, Zap, ExternalLink, Globe } from 'lucide-react';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import Link from 'next/link';
import { TheVoid } from '@/features/automation/components/TheVoid';

type ConsciousnessState = 'observing' | 'analyzing' | 'correcting';

export function SingularityPulse() {
  const [state, setState] = useState<ConsciousnessState>('observing');
  const [stats, setStats] = useState({ healed: 0, nudged: 0 });
  const [hasProposals, setHasProposals] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];

  useEffect(() => {
    if (!activeWorkspace) return;

    const cycle = async () => {
      setState('analyzing');
      try {
        const res = await fetch(`/api/v1/automation/pulse?workspaceId=${activeWorkspace.id}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (data.data.healed > 0 || data.data.nudged > 0) {
          setState('correcting');
          setStats((prev) => ({
            healed: prev.healed + data.data.healed,
            nudged: prev.nudged + data.data.nudged,
          }));
          setTimeout(() => setState('observing'), 5000);
        } else {
          setTimeout(() => setState('observing'), 3000);
        }
      } catch {
        setState('observing');
      }
    };

    const checkProposals = async () => {
      try {
        const res = await fetch(`/api/v1/automation/proposals?workspaceId=${activeWorkspace.id}`);
        const result = await res.json();
        setHasProposals(result.data?.length > 0);
      } catch (e) {
        console.error('Failed to fetch proposals', e);
      }
    };

    const interval = setInterval(() => {
      cycle();
      checkProposals();
    }, 60000);
    cycle();
    checkProposals();
    return () => clearInterval(interval);
  }, [activeWorkspace?.id]);

  return (
    <>
      <div className="relative group cursor-help">
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="relative flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl hover:bg-white/10 transition-all border-b-2"
            style={{
              borderColor:
                state === 'correcting'
                  ? 'rgba(234, 179, 8, 0.4)'
                  : state === 'analyzing'
                    ? 'rgba(99, 102, 241, 0.4)'
                    : 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="relative h-2 w-2">
              <motion.div
                animate={{
                  scale:
                    state === 'observing'
                      ? [1, 1.5, 1]
                      : state === 'analyzing'
                        ? [1, 2, 1]
                        : [1, 3, 1],
                }}
                transition={{ duration: state === 'observing' ? 3 : 1, repeat: Infinity }}
                className={`absolute inset-0 rounded-full blur-sm opacity-60 ${state === 'correcting' ? 'bg-yellow-400' : state === 'analyzing' ? 'bg-indigo-400' : 'bg-brand-500'}`}
              />
              <div
                className={`h-2 w-2 rounded-full relative z-10 ${state === 'correcting' ? 'bg-yellow-500 shadow-glow-amber' : state === 'analyzing' ? 'bg-indigo-500 shadow-glow-brand' : 'bg-brand-500'}`}
              />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              Neural Singularity
            </span>
          </motion.div>
        </AnimatePresence>

        <div className="absolute top-full right-0 mt-4 w-72 p-6 bg-slate-900/95 border border-white/10 rounded-3xl shadow-2xl backdrop-blur-3xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all translate-y-2 group-hover:translate-y-0 z-50">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-400" size={12} />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Active Pulse
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-bold text-emerald-400 uppercase">
                  Synchronized
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-white/5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 opacity-40">
                  <Activity size={10} />
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    Tactical Healing
                  </span>
                </div>
                <p className="text-sm font-black text-white">{stats.healed}</p>
              </div>
              <div className="p-3 bg-white/5 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 opacity-40">
                  <Zap size={10} />
                  <span className="text-[8px] font-black uppercase tracking-widest">
                    Neural Nudges
                  </span>
                </div>
                <p className="text-sm font-black text-white">{stats.nudged}</p>
              </div>
            </div>
            {hasProposals && (
              <Link
                href="/automation/symbiosis"
                className="flex items-center justify-between p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl hover:bg-brand-500/20 transition-all group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-500/20 rounded-lg">
                    <Globe size={14} className="text-brand-400" />
                  </div>
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">
                    Strategic Proposal
                  </span>
                </div>
                <ExternalLink
                  size={12}
                  className="text-white/20 group-hover/link:text-brand-400 transition-colors"
                />
              </Link>
            )}

            <button
              onClick={() => setShowVoid(true)}
              className="w-full flex items-center justify-center gap-3 py-4 bg-white text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-glow-white hover:scale-[1.02] transition-all"
            >
              <BrainCircuit size={14} /> Final Ascension
            </button>

            <p className="text-[8px] font-bold text-white/20 uppercase text-center leading-relaxed">
              Neural OS Protocol 55: The Living Singularity. Continuous ecosystem management active.
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showVoid && <TheVoid onClose={() => setShowVoid(false)} />}
      </AnimatePresence>
    </>
  );
}

function BrainCircuit({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2a3 3 0 0 0-3 3v7" />
      <path d="M9 18a3 3 0 0 1 3-3h.3" />
      <path d="M21 16a3 3 0 0 1-3 3h-5" />
      <path d="M15 2a3 3 0 0 0-3 3" />
      <path d="M12 22a3 3 0 0 0 3-3V5" />
      <path d="M9 12h3" />
      <path d="M3 13a3 3 0 0 0 3 3h3" />
    </svg>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Activity, ShieldCheck, Zap, ExternalLink } from 'lucide-react';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import Link from 'next/link';

type ConsciousnessState = 'observing' | 'analyzing' | 'correcting';

export function SingularityPulse() {
  const [state, setState] = useState<ConsciousnessState>('observing');
  const [stats, setStats] = useState({ healed: 0, nudged: 0 });
  const [hasProposals, setHasProposals] = useState(false);
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0];

  useEffect(() => {
    if (!activeWorkspace) return;

    // Simulate "Conscious" cycles
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
    }, 60000); // Pulse every minute

    cycle(); // Initial pulse
    checkProposals();

    return () => clearInterval(interval);
  }, [activeWorkspace?.id]);

  return (
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
          {/* Main Pulse Orb */}
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
              className={`absolute inset-0 rounded-full blur-sm opacity-60 ${
                state === 'correcting'
                  ? 'bg-yellow-400'
                  : state === 'analyzing'
                    ? 'bg-brand-500'
                    : 'bg-white/40'
              }`}
            />
            <div
              className={`relative h-full w-full rounded-full ${
                state === 'correcting'
                  ? 'bg-yellow-400'
                  : state === 'analyzing'
                    ? 'bg-brand-400'
                    : 'bg-white'
              }`}
            />
          </div>

          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
            Neural OS:{' '}
            <span
              className={
                state === 'correcting'
                  ? 'text-yellow-400'
                  : state === 'analyzing'
                    ? 'text-brand-400'
                    : 'text-white'
              }
            >
              {state}
            </span>
          </span>

          {/* Hover Stats Tooltip */}
          <div className="absolute top-full left-0 mt-3 w-48 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-50">
            <div className="p-4 bg-slate-900/90 border border-white/10 rounded-2xl backdrop-blur-2xl shadow-2xl space-y-3 pointer-events-auto">
              <div className="flex items-center gap-2">
                <Sparkles size={12} className="text-brand-400" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  Active Intelligence
                </span>
              </div>
              <div className="space-y-2">
                <StatRow
                  icon={<ShieldCheck size={10} />}
                  label="Healed Divergences"
                  value={stats.healed}
                />
                <StatRow icon={<Zap size={10} />} label="Strategic Nudges" value={stats.nudged} />
                <StatRow icon={<Activity size={10} />} label="System Consciousness" value="High" />
              </div>

              {hasProposals && activeWorkspace && (
                <Link
                  href={`/automation/symbiosis?workspaceId=${activeWorkspace.id}`}
                  className="mt-4 flex items-center justify-center gap-2 w-full p-2.5 bg-brand-500/20 border border-brand-500/40 rounded-xl text-[10px] font-black text-brand-400 uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all"
                >
                  <ExternalLink size={12} />
                  Review Proposals
                </Link>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-white/40">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
      </div>
      <span className="text-[9px] font-black text-white">{value}</span>
    </div>
  );
}

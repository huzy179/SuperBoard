'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Activity, Zap, ExternalLink, Globe } from 'lucide-react';
import { useWorkspaces } from '@/features/system/workspace/hooks/use-workspaces';
import Link from 'next/link';
import { TheVoid } from '@/features/specialized/automation/components/TheVoid';
import {
  getAutomationProposals,
  triggerAutomationPulse,
} from '@/features/specialized/automation/api/automation-service';

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
        const data = await triggerAutomationPulse(activeWorkspace.id);
        if (data.healed > 0 || data.nudged > 0) {
          setState('correcting');
          setStats((prev) => ({
            healed: prev.healed + data.healed,
            nudged: prev.nudged + data.nudged,
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
        const proposals = await getAutomationProposals(activeWorkspace.id);
        setHasProposals(proposals.length > 0);
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
  }, [activeWorkspace, activeWorkspace?.id]);

  return (
    <>
      <div className="relative group cursor-help">
        <div className="relative flex items-center gap-2 px-3 py-1.5 bg-black/[0.02] border border-surface-border rounded-full hover:bg-black/[0.04] transition-colors">
          <div
            className={`h-2 w-2 rounded-full ${
              state === 'correcting'
                ? 'bg-amber-500'
                : state === 'analyzing'
                  ? 'bg-brand-500'
                  : 'bg-emerald-500'
            }`}
            aria-hidden
          />
          <span className="text-xs font-medium text-[color:var(--color-muted)]">
            Automation pulse
          </span>
        </div>

        <div className="absolute top-full right-0 mt-3 w-72 p-5 bg-surface-card border border-surface-border rounded-xl shadow-glass opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-surface-border pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-brand-500" size={12} />
                <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Automation
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="text-xs text-emerald-700">Active</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-black/[0.02] border border-surface-border rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-[color:var(--color-muted)]">
                  <Activity size={10} />
                  <span className="text-xs">Healed</span>
                </div>
                <p className="text-base font-semibold text-[color:var(--color-ink)]">
                  {stats.healed}
                </p>
              </div>
              <div className="p-3 bg-black/[0.02] border border-surface-border rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-[color:var(--color-muted)]">
                  <Zap size={10} />
                  <span className="text-xs">Nudged</span>
                </div>
                <p className="text-base font-semibold text-[color:var(--color-ink)]">
                  {stats.nudged}
                </p>
              </div>
            </div>
            {hasProposals && (
              <Link
                href="/automation/symbiosis"
                className="flex items-center justify-between p-4 bg-brand-50 border border-brand-500/20 rounded-lg hover:bg-brand-100 transition-colors group/link"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg border border-brand-500/15">
                    <Globe size={14} className="text-brand-500" />
                  </div>
                  <span className="text-sm font-medium text-[color:var(--color-ink)]">
                    View proposals
                  </span>
                </div>
                <ExternalLink
                  size={12}
                  className="text-[color:var(--color-muted)] group-hover/link:text-brand-500 transition-colors"
                />
              </Link>
            )}

            <button
              onClick={() => setShowVoid(true)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-black/[0.05] text-[color:var(--color-ink)] border border-surface-border rounded-lg text-sm font-medium hover:bg-black/[0.07] transition-colors"
            >
              <BrainCircuit size={14} /> Activity log
            </button>

            <p className="text-xs text-[color:var(--color-muted)] text-center leading-relaxed">
              Automation runs periodically to keep the workspace healthy.
            </p>
          </div>
        </div>
      </div>

      <TheVoid
        isOpen={showVoid}
        workspaceId={activeWorkspace?.id ?? null}
        onClose={() => setShowVoid(false)}
      />
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

'use client';

import { useState, useEffect } from 'react';
import {
  Heart,
  ShieldCheck,
  Trash2,
  Zap,
  RefreshCw,
  ChevronRight,
  Clock,
  GitMerge,
} from 'lucide-react';
import { toast } from 'sonner';

interface HealthAction {
  id: string;
  agentName: string;
  actionType: string;
  targetId: string;
  reason: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export function WorkspaceHealth({ workspaceId }: { workspaceId: string }) {
  const [actions, setActions] = useState<HealthAction[]>([]);
  const [isHealing, setIsHealing] = useState(false);

  useEffect(() => {
    fetchHealth();
  }, [workspaceId]);

  const fetchHealth = async () => {
    try {
      const res = await fetch(`/api/v1/automation/health?workspaceId=${workspaceId}`);
      const body = await res.json();
      if (res.ok) {
        setActions(body.data.actions);
      }
    } catch {
      toast.error('Failed to sync Workspace Health');
    }
  };

  const handleHeal = async () => {
    setIsHealing(true);
    try {
      const res = await fetch(`/api/v1/automation/heal?workspaceId=${workspaceId}`, {
        method: 'POST',
      });
      const body = await res.json();
      if (res.ok) {
        toast.success(`Healing complete: ${body.data.archived} items archived.`);
        fetchHealth();
      }
    } catch {
      toast.error('Healing cycle failed');
    } finally {
      setIsHealing(false);
    }
  };

  const redundancyActions = actions.filter((a) => a.actionType === 'SUGGEST_MERGE');
  const archivalActions = actions.filter((a) => a.actionType === 'AUTO_ARCHIVE');

  return (
    <div className="flex flex-col gap-10 p-10 bg-black/40 rounded-[3rem] border border-white/5 font-sans min-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shadow-glow-rose">
            <Heart size={32} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Self-Organizing Heartbeat
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Autonomous Workspace Refactoring
              </span>
              <div className="h-1 w-1 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[9px] font-bold text-emerald-500/60 uppercase">
                System_Nominal_Heal_Ready
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleHeal}
          disabled={isHealing}
          className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-glow-indigo disabled:opacity-50"
        >
          {isHealing ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
          Trigger Heal Cycle
        </button>
      </div>

      <div className="grid grid-cols-12 gap-10">
        {/* Left: suggestions */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em]">
              Neural Suggestions
            </h3>
            <span className="text-[10px] font-bold text-emerald-500 lowercase opacity-60 italic">
              {redundancyActions.length} duplications detected
            </span>
          </div>

          <div className="space-y-4">
            {redundancyActions.length > 0 ? (
              redundancyActions.map((action) => (
                <div
                  key={action.id}
                  className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all flex flex-col gap-6 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 blur-3xl -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-colors" />

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <GitMerge size={22} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-lg font-black text-white uppercase italic tracking-tighter">
                          Merge Recommended
                        </span>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
                          Ref: {action.targetId.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                    <button className="p-3 rounded-xl bg-white/5 text-white/40 hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </div>

                  <p className="text-sm font-medium text-white/60 leading-relaxed pr-10">
                    {action.reason}
                  </p>

                  <div className="flex items-center gap-4 mt-2">
                    <button className="px-6 py-2.5 rounded-xl bg-indigo-600 text-[10px] font-black text-white uppercase tracking-widest hover:bg-indigo-500 transition-colors">
                      Execute Merge
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-white/5 text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white transition-colors">
                      Dismiss Signal
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-20 flex flex-col items-center justify-center gap-6 rounded-[2.5rem] bg-white/[0.01] border border-white/5 border-dashed">
                <ShieldCheck size={60} className="text-white/10" />
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                  No Redundancies Detected
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Archival Log */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-8">
          <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] px-2 truncate">
            Archival Heartbeat
          </h3>

          <div className="flex-1 rounded-[2.5rem] bg-black/60 border border-white/10 p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex-1 overflow-auto scrollbar-hide space-y-6">
              {archivalActions.map((action) => (
                <div key={action.id} className="flex gap-4 group">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-all">
                      <Clock size={14} />
                    </div>
                    <div className="w-px flex-1 bg-white/5" />
                  </div>
                  <div className="flex-1 pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                        Self_Cleanup_Archived
                      </span>
                      <span className="text-[9px] font-black text-white/20 italic tabular-nums">
                        {new Date(action.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/40 leading-relaxed italic">
                      "{action.reason}"
                    </p>
                  </div>
                </div>
              ))}
              {archivalActions.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center opacity-20">
                  <Trash2 size={40} />
                  <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                    No Archival Events
                  </span>
                </div>
              )}
            </div>

            <div className="pt-6 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Health Operations
                </span>
                <span className="text-[11px] font-black text-white/60 tabular-nums italic">
                  {actions.length} Total
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

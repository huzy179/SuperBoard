'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowDown, Settings2, Zap, Fingerprint, CheckCircle2 } from 'lucide-react';

interface Directive {
  id: string;
  reason: string;
  metadata: {
    title: string;
    actions: Array<{ type: string; reason: string }>;
    outcome: string;
    status: 'PENDING' | 'EXECUTED';
  };
}

export function ExecutiveDirective({ workspaceId }: { workspaceId: string }) {
  const [directive, setDirective] = useState<Directive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/automation/executive/directive?workspaceId=${workspaceId}`)
      .then((res) => res.json())
      .then((res) => {
        setDirective(res.data);
        setIsLoading(false);
      });
  }, [workspaceId]);

  const handleExecute = async () => {
    if (!directive) return;
    setIsExecuting(true);
    await fetch(`/api/v1/automation/executive/directive/${directive.id}/execute`, {
      method: 'POST',
    });
    setDirective((prev) =>
      prev ? { ...prev, metadata: { ...prev.metadata, status: 'EXECUTED' } } : null,
    );
    setIsExecuting(false);
  };

  if (isLoading) return <DirectiveSkeleton />;
  if (!directive) return null;

  const isExecuted = directive.metadata.status === 'EXECUTED';

  return (
    <div className="space-y-10 py-8 px-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-brand-500/10 rounded-2xl border border-brand-500/20">
          <ShieldAlert className="h-5 w-5 text-brand-400" />
        </div>
        <div className="space-y-1">
          <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
            Chỉ thị AI
          </h2>
          <p className="text-sm font-bold text-white uppercase tracking-tight italic">
            Giao thức chỉ thị toàn cục
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative p-8 rounded-[3.5rem] border backdrop-blur-3xl overflow-hidden transition-all duration-1000 ${
          isExecuted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900/50 border-white/10'
        }`}
      >
        {/* Cinematic Header */}
        <div className="mb-12 space-y-4 text-center">
          <div className="mx-auto w-12 h-1 bg-brand-500/20 rounded-full mb-6" />
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic leading-none">
            {directive.metadata.title}
          </h3>
          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
            {directive.reason}
          </p>
        </div>

        {/* Chained Actions Loop */}
        <div className="space-y-6 mb-12 relative">
          <div className="absolute left-[39px] top-8 bottom-8 w-[2px] bg-brand-500/10" />

          {directive.metadata.actions.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              className="relative flex items-start gap-6 group"
            >
              <div
                className={`mt-1 h-20 w-20 rounded-2xl flex items-center justify-center border z-10 transition-all ${
                  isExecuted
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-slate-900 border-white/10 text-brand-400 group-hover:border-brand-500/40'
                }`}
              >
                <Settings2 size={20} />
              </div>

              <div className="flex-1 pt-2 space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                    Action {idx + 1}
                  </span>
                  {isExecuted && <CheckCircle2 size={12} className="text-emerald-400" />}
                </div>
                <p className="text-[11px] font-bold text-white uppercase tracking-tight">
                  {action.type.replace('_', ' ')}
                </p>
                <p className="text-[10px] font-bold text-white/20 italic max-w-md">
                  "{action.reason}"
                </p>
              </div>

              {idx < directive.metadata.actions.length - 1 && (
                <div className="absolute left-[34px] bottom-[-24px] p-1 bg-slate-900 border border-white/10 rounded-full z-20">
                  <ArrowDown size={10} className="text-white/20" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Predicted Outcome */}
        <div className="p-8 bg-brand-500/5 border border-brand-500/10 rounded-[2.5rem] mb-12 flex items-center gap-6">
          <div className="h-12 w-12 bg-brand-500/10 rounded-full flex items-center justify-center border border-brand-500/20">
            <Zap className="text-brand-400" size={20} />
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">
              Predicted Strategic Outcome
            </p>
            <p className="text-[11px] font-black text-brand-400 uppercase tracking-tight italic">
              "{directive.metadata.outcome}"
            </p>
          </div>
        </div>

        {/* Executive Action */}
        <div className="pt-6 border-t border-white/5 text-center">
          {!isExecuted ? (
            <button
              onClick={handleExecute}
              disabled={isExecuting}
              className="w-full flex items-center justify-center gap-4 px-10 py-6 bg-brand-500 rounded-[2rem] text-[11px] font-black text-white uppercase tracking-[0.4em] shadow-glow-brand hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              {isExecuting ? (
                <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Fingerprint size={18} /> Ký & gửi chỉ thị
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-3 py-6 text-emerald-400">
              <CheckCircle2 size={24} />
              <span className="text-[11px] font-black uppercase tracking-[0.4em]">
                Chỉ thị đã được gửi
              </span>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DirectiveSkeleton() {
  return (
    <div className="space-y-10 py-8 px-6 animate-pulse">
      <div className="h-12 w-64 bg-white/5 rounded-2xl" />
      <div className="h-[500px] bg-white/5 rounded-[4rem]" />
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { X, Settings2, Wind, Layers, Telescope, AlertCircle } from 'lucide-react';

interface SimulationResult {
  prediction: string;
  confidence: number;
  metrics: {
    completionDays: number;
    driftIndex: number;
    stability: number;
  };
  trajectory: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
}

export function StrategicSandbox({
  projectId,
  onClose,
  onResultUpdate,
}: {
  projectId: string;
  onClose: () => void;
  onResultUpdate: (result: SimulationResult) => void;
}) {
  const [params, setParams] = useState({
    velocityMultiplier: 1.0,
    addedPoints: 0,
    driftIntensityModifier: 0,
  });

  useEffect(() => {
    const simulate = async () => {
      const res = await fetch(`/api/v1/projects/${projectId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      onResultUpdate(data.data);
    };

    const delay = setTimeout(simulate, 300);
    return () => clearTimeout(delay);
  }, [params, projectId]);

  return (
    <div className="flex flex-col h-full bg-slate-950/90 border-l border-white/10 backdrop-blur-[50px] p-12 space-y-12 overflow-y-auto elite-scrollbar shadow-luxe group">
      {/* Dynamic Glow Background */}
      <div className="absolute top-0 right-0 w-full h-full bg-brand-500/[0.02] pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
            <Telescope className="text-brand-400 animate-pulse" size={20} />
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-[0.5em] text-white">
              Strategic Sandbox
            </h3>
            <p className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
              Trajectory Modeling v4.2
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 text-white/20 hover:text-white transition-all active:scale-95"
        >
          <X size={20} />
        </button>
      </div>

      <div className="relative z-10 space-y-12">
        {/* Velocity Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-500/5 rounded-lg border border-brand-500/10 group-hover/field:border-brand-500/30 transition-all">
                <Wind size={14} className="text-brand-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover/field:text-brand-400 transition-colors">
                Velocity Multiplier
              </span>
            </div>
            <span className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              {(params.velocityMultiplier * 100).toFixed(0)}%
            </span>
          </div>
          <div className="relative px-2">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={params.velocityMultiplier}
              onChange={(e) =>
                setParams((p) => ({ ...p, velocityMultiplier: parseFloat(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-brand-500 shadow-inner"
            />
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-brand-500/10 -z-10 -translate-y-1/2 rounded-full" />
          </div>
          <div className="flex justify-between text-[9px] font-black text-white/10 uppercase tracking-[0.2em] px-2">
            <span>Burnout</span>
            <span className="text-white/5">Optimized</span>
            <span>Enhanced</span>
          </div>
        </div>

        {/* Scope Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-500/5 rounded-lg border border-brand-500/10 group-hover/field:border-brand-500/30 transition-all">
                <Layers size={14} className="text-brand-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover/field:text-brand-400 transition-colors">
                Scope Expansion
              </span>
            </div>
            <span className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              +{params.addedPoints} SP
            </span>
          </div>
          <div className="relative px-2">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={params.addedPoints}
              onChange={(e) => setParams((p) => ({ ...p, addedPoints: parseInt(e.target.value) }))}
              className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-brand-500 shadow-inner"
            />
          </div>
          <div className="flex justify-between text-[9px] font-black text-white/10 uppercase tracking-[0.2em] px-2">
            <span>Baseline</span>
            <span className="text-white/5">Moderate Drift</span>
            <span>Extreme Creep</span>
          </div>
        </div>

        {/* Drift Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-rose-500/5 rounded-lg border border-rose-500/10 group-hover/field:border-rose-500/30 transition-all">
                <AlertCircle size={14} className="text-rose-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 group-hover/field:text-rose-400 transition-colors">
                Architectural Stress
              </span>
            </div>
            <span className="text-xs font-black text-white px-3 py-1 bg-white/5 rounded-lg border border-white/5">
              {(params.driftIntensityModifier * 10).toFixed(1)} Index
            </span>
          </div>
          <div className="relative px-2">
            <input
              type="range"
              min="-0.5"
              max="0.5"
              step="0.1"
              value={params.driftIntensityModifier}
              onChange={(e) =>
                setParams((p) => ({ ...p, driftIntensityModifier: parseFloat(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-900 rounded-full appearance-none cursor-pointer accent-brand-500 shadow-inner"
            />
          </div>
          <div className="flex justify-between text-[9px] font-black text-white/10 uppercase tracking-[0.2em] px-2">
            <span>Refined</span>
            <span className="text-white/5">Nominal</span>
            <span>Chaotic</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 p-8 bg-brand-500/[0.01] border border-white/5 rounded-[2.5rem] space-y-6 shadow-inner mt-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-500/10 rounded-xl">
            <Settings2 size={12} className="text-brand-400" />
          </div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">
            Simulation Context
          </span>
        </div>
        <p className="text-[13px] font-bold text-white/60 italic leading-relaxed">
          "This sandbox utilizes virtualized forecasting. Changes made here will not mutate mission
          critical data, but will allow you to explore alternative trajectories."
        </p>
        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.5em]">
            Neural Link Status: Active
          </span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
        </div>
      </div>
    </div>
  );
}

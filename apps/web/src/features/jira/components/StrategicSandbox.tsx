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
    <div className="flex flex-col h-full bg-slate-900 border-l border-white/5 backdrop-blur-3xl p-8 space-y-10 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Telescope className="text-brand-400" size={20} />
          <h3 className="text-[12px] font-black uppercase tracking-[0.4em] text-white">
            Strategic Sandbox
          </h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-white/40">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-8">
        {/* Velocity Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <Wind size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-300">
                Team Velocity Multiplier
              </span>
            </div>
            <span className="text-[10px] font-black text-white">
              {(params.velocityMultiplier * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={params.velocityMultiplier}
            onChange={(e) =>
              setParams((p) => ({ ...p, velocityMultiplier: parseFloat(e.target.value) }))
            }
            className="w-full accent-brand-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
            <span>Burnout</span>
            <span>Optimized</span>
            <span>Enhanced</span>
          </div>
        </div>

        {/* Scope Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <Layers size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Simulated Scope Expansion
              </span>
            </div>
            <span className="text-[10px] font-black text-white">+{params.addedPoints} SP</span>
          </div>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={params.addedPoints}
            onChange={(e) => setParams((p) => ({ ...p, addedPoints: parseInt(e.target.value) }))}
            className="w-full accent-brand-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
            <span>Baseline</span>
            <span>Moderate Drift</span>
            <span>Extreme Creep</span>
          </div>
        </div>

        {/* Drift Control */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white/40">
              <AlertCircle size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Architectural Stress
              </span>
            </div>
            <span className="text-[10px] font-black text-white">
              {(params.driftIntensityModifier * 10).toFixed(1)} Index
            </span>
          </div>
          <input
            type="range"
            min="-0.5"
            max="0.5"
            step="0.1"
            value={params.driftIntensityModifier}
            onChange={(e) =>
              setParams((p) => ({ ...p, driftIntensityModifier: parseFloat(e.target.value) }))
            }
            className="w-full accent-brand-500 bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
            <span>Refined</span>
            <span>Nominal</span>
            <span>Chaotic</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-brand-500/5 border border-brand-500/10 rounded-3xl space-y-4">
        <div className="flex items-center gap-2">
          <Settings2 size={12} className="text-brand-400" />
          <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
            Simulation Context
          </span>
        </div>
        <p className="text-[11px] font-bold text-white/60 italic leading-relaxed">
          This sandbox uses virtualized forecasting. Changes made here will not affect your actual
          mission data, but will allow you to explore alternative trajectories.
        </p>
      </div>
    </div>
  );
}

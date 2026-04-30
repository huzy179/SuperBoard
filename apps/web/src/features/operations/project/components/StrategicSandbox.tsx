'use client';

import { useState, useEffect } from 'react';
import { X, Settings2, Wind, Layers, Telescope, AlertCircle } from 'lucide-react';
import { simulateProject } from '../api/project-service';

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
      const data = await simulateProject(projectId, params);
      onResultUpdate(data);
    };

    const delay = setTimeout(simulate, 300);
    return () => clearTimeout(delay);
  }, [params, projectId, onResultUpdate]);

  return (
    <div className="flex flex-col h-full bg-surface-card border-l border-surface-border p-10 space-y-10 overflow-y-auto elite-scrollbar shadow-glass">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand-50 rounded-xl border border-brand-500/15 text-brand-500">
            <Telescope size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[color:var(--color-ink)] tracking-tight">
              Strategic Sandbox
            </h3>
            <p className="text-sm text-[color:var(--color-muted)] mt-1">Trajectory modeling</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 bg-black/[0.02] border border-surface-border rounded-full hover:bg-black/[0.04] text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-10">
        {/* Velocity Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-50 rounded-lg border border-brand-500/15">
                <Wind size={14} className="text-brand-400" />
              </div>
              <span className="text-sm font-medium text-[color:var(--color-muted)]">
                Velocity Multiplier
              </span>
            </div>
            <span className="text-sm font-medium text-[color:var(--color-ink)] px-3 py-1 bg-black/[0.02] rounded-lg border border-surface-border">
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
              className="w-full h-1.5 bg-black/[0.08] rounded-full appearance-none cursor-pointer accent-brand-500"
            />
          </div>
          <div className="flex justify-between text-xs text-[color:var(--color-faint)] px-2">
            <span>Low</span>
            <span>Nominal</span>
            <span>High</span>
          </div>
        </div>

        {/* Scope Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-brand-50 rounded-lg border border-brand-500/15">
                <Layers size={14} className="text-brand-400" />
              </div>
              <span className="text-sm font-medium text-[color:var(--color-muted)]">
                Scope Expansion
              </span>
            </div>
            <span className="text-sm font-medium text-[color:var(--color-ink)] px-3 py-1 bg-black/[0.02] rounded-lg border border-surface-border">
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
              className="w-full h-1.5 bg-black/[0.08] rounded-full appearance-none cursor-pointer accent-brand-500"
            />
          </div>
          <div className="flex justify-between text-xs text-[color:var(--color-faint)] px-2">
            <span>Baseline</span>
            <span>Moderate</span>
            <span>High</span>
          </div>
        </div>

        {/* Drift Control */}
        <div className="space-y-6 group/field">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-rose-50 rounded-lg border border-rose-200">
                <AlertCircle size={14} className="text-rose-400" />
              </div>
              <span className="text-sm font-medium text-[color:var(--color-muted)]">
                Architectural Stress
              </span>
            </div>
            <span className="text-sm font-medium text-[color:var(--color-ink)] px-3 py-1 bg-black/[0.02] rounded-lg border border-surface-border">
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
              className="w-full h-1.5 bg-black/[0.08] rounded-full appearance-none cursor-pointer accent-brand-500"
            />
          </div>
          <div className="flex justify-between text-xs text-[color:var(--color-faint)] px-2">
            <span>Refined</span>
            <span>Nominal</span>
            <span>Chaotic</span>
          </div>
        </div>
      </div>

      <div className="p-6 bg-[color:var(--color-surface-alt)]/40 border border-surface-border rounded-xl space-y-4 shadow-inner mt-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-50 rounded-lg border border-brand-500/15 text-brand-500">
            <Settings2 size={12} />
          </div>
          <span className="text-sm font-semibold text-[color:var(--color-ink)]">
            Simulation context
          </span>
        </div>
        <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
          This sandbox runs simulated forecasting. It does not change mission data and is safe to
          explore alternatives.
        </p>
        <div className="pt-4 flex items-center justify-between border-t border-surface-border">
          <span className="text-xs text-[color:var(--color-muted)]">Link status: Active</span>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}

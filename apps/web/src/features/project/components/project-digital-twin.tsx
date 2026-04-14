'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  Monitor,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Minus,
  Plus,
  Play,
} from 'lucide-react';
import { TwinPulseVisualizer } from './twin-pulse-visualizer';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface ForecastData {
  projectId: string;
  velocityPerDay: number;
  atRiskCount: number;
  predictions: {
    taskId: string;
    title: string;
    status: string;
    estimatedCompletionDate: string;
    isAtRisk: boolean;
    confidence: number;
  }[];
}

export function ProjectDigitalTwin({ projectId }: { projectId: string }) {
  const [baselineData, setBaselineData] = useState<{
    healthScore: number;
    executiveBrief: string;
    forecast: ForecastData;
  } | null>(null);
  const [simulatedForecast, setSimulatedForecast] = useState<ForecastData | null>(null);
  const [velocityBoost, setVelocityBoost] = useState(0); // 0% to 100%
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchBaseline();
  }, [projectId]);

  const fetchBaseline = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/executive/projects/${projectId}/briefing`);
      const body = await res.json();
      if (res.ok) {
        setBaselineData(body.data);
        setSimulatedForecast(body.data.forecast);
      }
    } catch {
      toast.error('Failed to initialize Digital Twin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async () => {
    setIsSimulating(true);
    try {
      const res = await fetch(`/api/v1/executive/projects/${projectId}/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ velocityBoost: velocityBoost / 100 }),
      });
      const body = await res.json();
      if (res.ok) {
        setSimulatedForecast(body.data.forecast);
        toast.success('Simulation updated');
      }
    } catch {
      toast.error('Simulation failed');
    } finally {
      setIsSimulating(false);
    }
  };

  if (isLoading || !baselineData) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-6 opacity-40 grayscale animate-pulse">
        <Monitor size={80} className="text-white/20" />
        <span className="text-[11px] font-black text-white uppercase tracking-[0.5em]">
          Synchronizing Digital Twin...
        </span>
      </div>
    );
  }

  const currentForecast = simulatedForecast || baselineData.forecast;
  const projectEnd =
    currentForecast.predictions.length > 0
      ? new Date(
          currentForecast.predictions[currentForecast.predictions.length - 1]
            ?.estimatedCompletionDate || new Date().toISOString(),
        )
      : new Date();

  return (
    <div className="flex flex-col gap-10 p-10 bg-slate-950 min-h-screen text-white/90 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
            <Activity size={32} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">
              Strategic Digital Twin
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Predictive Strategic Simulation
              </span>
              <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest leading-none">
                REAL_TIME_PULSE_LINKED
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBaseline}
            className="p-4 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-10 overflow-hidden">
        {/* Left: The Pulse & Simulation */}
        <div className="col-span-12 lg:col-span-5 space-y-10">
          <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 backdrop-blur-3xl space-y-10">
            <TwinPulseVisualizer
              data={{
                healthScore: baselineData.healthScore,
                velocity: currentForecast.velocityPerDay,
                atRiskCount: currentForecast.atRiskCount,
              }}
            />

            {/* Simulation Levers */}
            <div className="space-y-6 pt-10 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
                  Simulation Levers
                </h3>
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                  Neural Sandbox Active
                </div>
              </div>

              <div className="space-y-4 p-8 rounded-[2rem] bg-black/40 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
                    Velocity Boost
                  </span>
                  <span className="text-xl font-black text-indigo-400 tabular-nums">
                    +{velocityBoost}%
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setVelocityBoost(Math.max(0, velocityBoost - 10))}
                    className="p-3 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full relative overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{ width: `${velocityBoost}%` }}
                      className="absolute inset-y-0 left-0 bg-indigo-500 shadow-glow-indigo"
                    />
                  </div>
                  <button
                    onClick={() => setVelocityBoost(Math.min(100, velocityBoost + 10))}
                    className="p-3 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  onClick={handleSimulate}
                  disabled={isSimulating}
                  className="w-full mt-6 py-5 rounded-[1.5rem] bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.25em] flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-glow-indigo disabled:opacity-50"
                >
                  {isSimulating ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <Play size={16} />
                  )}
                  Execute Simulation
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: The Forecast & Risks */}
        <div className="col-span-12 lg:col-span-7 space-y-10 h-full overflow-hidden flex flex-col">
          {/* Forecast Summary */}
          <div className="grid grid-cols-2 gap-8">
            <div className="p-8 rounded-[2rem] bg-emerald-500/5 border border-emerald-500/10 space-y-2">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <Calendar size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Est. Release Date
                </span>
              </div>
              <span className="text-3xl font-black text-white uppercase tracking-tighter tabular-nums">
                {projectEnd.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
              <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
                Strategic Horizon
              </p>
            </div>
            <div className="p-8 rounded-[2rem] bg-rose-500/5 border border-rose-500/10 space-y-2">
              <div className="flex items-center gap-3 text-rose-400 mb-2">
                <AlertTriangle size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  At-Risk Missions
                </span>
              </div>
              <span className="text-3xl font-black text-white tabular-nums">
                {currentForecast.atRiskCount}
              </span>
              <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
                Logic Inconsistencies
              </p>
            </div>
          </div>

          {/* Predictive Mission List */}
          <div className="flex-1 rounded-[3rem] bg-white/[0.02] border border-white/5 p-10 overflow-hidden flex flex-col">
            <h3 className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mb-10">
              Neural Mission Forecast
            </h3>

            <div className="flex-1 overflow-auto scrollbar-hide space-y-4">
              {currentForecast.predictions.map((p, i) => (
                <div
                  key={p.taskId}
                  className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between group ${
                    p.isAtRisk
                      ? 'bg-rose-500/5 border-rose-500/20 shadow-glow-rose'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${
                        p.isAtRisk ? 'bg-rose-500/20 text-rose-400' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                        {p.title}
                      </span>
                      <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mt-1">
                        Ref: {p.taskId.slice(0, 8)} • Confidence: {Math.round(p.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span
                      className={`text-xs font-black uppercase tracking-tighter ${p.isAtRisk ? 'text-rose-400' : 'text-emerald-400 opacity-60'}`}
                    >
                      {new Date(p.estimatedCompletionDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest mt-1">
                      Est. End
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

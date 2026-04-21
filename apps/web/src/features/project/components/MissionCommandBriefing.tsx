'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, ShieldAlert, TrendingUp, Cpu, Eye, Zap, Activity } from 'lucide-react';
import { StrategicSandbox } from './StrategicSandbox';
import { ExecutiveDirective } from '@/features/automation/components/ExecutiveDirective';

interface BriefingData {
  missionName: string;
  sitrep: string;
  metrics: {
    velocity: number;
    collisions: number;
    pulses: number;
  };
  latestIntensity: number;
}

interface ForecastData {
  prediction: string;
  confidence: number;
  metrics: {
    completionDays: number;
    driftIndex: number;
    stability: number;
  };
  trajectory: 'POSITIVE' | 'NEUTRAL' | 'CRITICAL';
}

export function MissionCommandBriefing({
  projectId,
  isOpen,
  onClose,
}: {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [simulatedForecast, setSimulatedForecast] = useState<ForecastData | null>(null);
  const [showSandbox, setShowSandbox] = useState(false);
  const [showExecutive, setShowExecutive] = useState(false);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/v1/projects/${projectId}/briefing`)
        .then((res) => res.json())
        .then((res) => {
          setData(res.data);
          startBriefing(res.data.sitrep);
        });

      fetch(`/api/v1/projects/${projectId}/forecast`)
        .then((res) => res.json())
        .then((res) => setForecast(res.data));
    } else {
      setDisplayText('');
      setData(null);
      setForecast(null);
      setSimulatedForecast(null);
      setShowSandbox(false);
      setShowExecutive(false);
    }
  }, [isOpen, projectId]);

  const startBriefing = (text: string) => {
    setIsTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(text.slice(0, i));
      i++;
      if (i > text.length) {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 30);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-[40px] flex items-center justify-center p-8 overflow-hidden"
      >
        {/* Background Atmosphere */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[1200px] max-h-[800px] rounded-full bg-brand-500/5 blur-[120px] pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-12 right-12 p-5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all z-20 group active:scale-95"
        >
          <X size={28} className="text-white/20 group-hover:text-white" />
        </button>

        <div className="max-w-[1400px] w-full grid grid-cols-1 lg:grid-cols-4 gap-16 items-start relative z-10">
          {/* Left: Intelligence Slants */}
          <div className="hidden lg:flex flex-col gap-8">
            <div className="mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/20 mb-2">
                INTELLIGENCE_QUOTIENT
              </h4>
              <div className="h-0.5 w-12 bg-brand-500 shadow-glow-brand" />
            </div>

            <SlantCard
              icon={<Cpu size={18} />}
              label="Neural Topology"
              value="STABLE_OS"
              sub="Cognitive Atlas Synced"
            />
            <SlantCard
              icon={<ShieldAlert size={18} />}
              label="Divergence"
              value={data?.metrics.collisions || 0}
              sub="Active Logic Collisions"
              urgent={data?.metrics.collisions ? data.metrics.collisions > 0 : false}
            />
            <SlantCard
              icon={<TrendingUp size={18} />}
              label="Strategic Velocity"
              value={data?.metrics.velocity || 0}
              sub="Units / Pulse Cycle"
            />

            {forecast && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-8 bg-white/[0.01] border border-white/5 rounded-[3rem] space-y-8 shadow-inner backdrop-blur-3xl relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <Eye size={16} className="text-brand-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
                      THE_ORACLE
                    </span>
                  </div>
                  <button
                    onClick={() => setShowSandbox(!showSandbox)}
                    className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${showSandbox ? 'bg-brand-500 text-white shadow-glow-brand' : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'}`}
                  >
                    Simulate
                  </button>
                </div>

                <div className="space-y-4 relative z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.2em]">
                      Confidence Vector
                    </span>
                    <span className="text-[11px] font-black text-brand-400 shadow-glow-brand/20">
                      {((simulatedForecast?.confidence || forecast.confidence) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden shadow-inner">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${(simulatedForecast?.confidence || forecast.confidence) * 100}%`,
                      }}
                      className={`h-full ${simulatedForecast ? 'bg-amber-400 shadow-glow-amber' : 'bg-brand-500 shadow-glow-brand'}`}
                    />
                  </div>
                </div>

                <p className="text-xs font-bold text-white uppercase tracking-tight italic leading-relaxed text-white/60 relative z-10 bg-slate-950/50 p-4 rounded-2xl border border-white/5">
                  "{simulatedForecast?.prediction || forecast.prediction}"
                </p>

                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                      EST_WINDOW
                    </span>
                    <div className="flex items-baseline gap-2">
                      <p className="text-2xl font-black text-white italic">
                        {simulatedForecast?.metrics.completionDays ||
                          forecast.metrics.completionDays}
                      </p>
                      <span className="text-[10px] font-black text-white/20">DAYS</span>
                      {simulatedForecast && (
                        <span
                          className={`text-[11px] font-black ml-auto ${simulatedForecast.metrics.completionDays < forecast.metrics.completionDays ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {simulatedForecast.metrics.completionDays <
                          forecast.metrics.completionDays
                            ? '↓'
                            : '↑'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                      DRIFT_IDX
                    </span>
                    <p
                      className={`text-2xl font-black ${forecast.metrics.driftIndex > 0.5 ? 'text-red-400 shadow-glow-red/20' : 'text-emerald-400 shadow-glow-emerald/20'}`}
                    >
                      {forecast.metrics.driftIndex.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Center: Command Feed */}
          <div className="lg:col-span-3 space-y-16">
            <div className="flex items-end justify-between px-4">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-500/10 rounded-xl border border-brand-500/20">
                    <Terminal className="h-5 w-5 text-brand-500 animate-pulse" />
                  </div>
                  <span className="text-[11px] font-black text-white/20 uppercase tracking-[0.6em] animate-pulse">
                    Command Nexus Active
                  </span>
                </div>
                <h2 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter leading-none italic">
                  {data?.missionName || 'MISSION'}{' '}
                  <span className="text-white/10 not-italic">
                    {showExecutive ? 'DIRECTIVE' : 'BRIEFING'}
                  </span>
                </h2>
              </div>

              <div className="flex flex-col items-end gap-2 mb-2">
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ x: [-128, 128] }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                    className="h-full w-24 bg-brand-500/40 blur-sm"
                  />
                </div>
                <span className="text-[8px] font-black text-white/10 uppercase tracking-[0.3em]">
                  SECURE_VOID_TRANSFER
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/[0.01] border border-white/5 p-2 rounded-2xl w-fit ml-4">
              <button
                onClick={() => setShowExecutive(false)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl transition-all ${!showExecutive ? 'bg-white text-slate-950 shadow-luxe' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                MISSION_SITREP
              </button>
              <button
                onClick={() => setShowExecutive(true)}
                className={`text-[10px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-xl transition-all ${showExecutive ? 'bg-brand-500 text-white shadow-glow-brand' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                EXECUTIVE_DIRECTIVE
              </button>
            </div>

            {showExecutive ? (
              <ExecutiveDirective workspaceId="default-workspace" />
            ) : (
              <div className="relative min-h-[450px] p-12 rounded-[4rem] border border-white/5 bg-white/[0.01] shadow-inner backdrop-blur-3xl overflow-hidden group">
                {/* Visual accents */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500/40 to-transparent opacity-50" />

                <div className="relative z-10 space-y-12">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse shadow-glow-brand" />
                      <span className="text-[11px] font-black text-brand-400 uppercase tracking-[0.4em]">
                        Intelligence Synthesis
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap size={14} className="text-white/10" />
                      <span className="text-[9px] font-black text-white/5 uppercase tracking-widest">
                        B-RATING: 0.94
                      </span>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <p className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-relaxed italic border-l-8 border-brand-500 pl-12 transition-all">
                      {displayText}
                      {isTyping && (
                        <span className="inline-block w-3 h-8 bg-brand-500 animate-pulse ml-4 shadow-glow-brand" />
                      )}
                    </p>

                    {!isTyping && data && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-10 pt-16"
                      >
                        <button className="relative px-12 py-5 bg-white text-slate-950 rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.4em] shadow-luxe hover:scale-105 active:scale-95 transition-all group/exec">
                          <div className="absolute inset-x-0 top-0 h-px bg-slate-950/20" />
                          Execute Directives
                        </button>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-6 w-1.5 rounded-full transition-all duration-500 shadow-glow-brand/10 ${i < data.latestIntensity * 5 ? 'bg-brand-500' : 'bg-white/5'}`}
                              />
                            ))}
                          </div>
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest block">
                              Pulse Intensity
                            </span>
                            <span className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em]">
                              S_LVL: 09
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between py-8 px-10 bg-white/[0.01] border border-white/5 rounded-[2.5rem] shadow-inner ml-4 mr-4 group hover:bg-white/[0.02] transition-all">
              <div className="flex items-center gap-6">
                <div className="h-12 w-12 bg-brand-500/10 rounded-2xl flex items-center justify-center border border-brand-500/30 group-hover:border-brand-500 transition-all">
                  <Zap className="h-6 w-6 text-brand-500 fill-brand-500/20" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black text-white uppercase tracking-[0.3em]">
                    Neural Voice Core
                  </p>
                  <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
                    SYNTHESIS_LAYER_4 // ACTIVE_OS
                  </p>
                </div>
              </div>
              <Activity className="h-5 w-5 text-brand-500/20 group-hover:text-brand-500/40 transition-all" />
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showSandbox && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed inset-y-0 right-0 w-[450px] z-[120] shadow-luxe"
          >
            <StrategicSandbox
              projectId={projectId}
              onClose={() => setShowSandbox(false)}
              onResultUpdate={(res) => setSimulatedForecast(res as ForecastData)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatePresence>
  );
}

function SlantCard({
  icon,
  label,
  value,
  sub,
  urgent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub: string;
  urgent?: boolean;
}) {
  return (
    <div
      className={`p-6 bg-white/5 border rounded-3xl space-y-3 transition-all ${urgent ? 'border-red-500/40 bg-red-500/5 shadow-glow-red/5' : 'border-white/10'}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-lg ${urgent ? 'bg-red-500/10 text-red-400' : 'bg-brand-500/10 text-brand-400'}`}
        >
          {icon}
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
          {label}
        </span>
      </div>
      <div className="space-y-0.5">
        <p
          className={`text-2xl font-black uppercase tracking-tight ${urgent ? 'text-red-400' : 'text-white'}`}
        >
          {value}
        </p>
        <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">{sub}</p>
      </div>
    </div>
  );
}

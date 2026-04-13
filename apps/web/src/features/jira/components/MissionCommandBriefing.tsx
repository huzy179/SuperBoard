'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, ShieldAlert, TrendingUp, Cpu, Eye } from 'lucide-react';

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
        className="fixed inset-0 z-[100] bg-[#020617]/95 backdrop-blur-2xl flex items-center justify-center p-6"
      >
        <button
          onClick={onClose}
          className="absolute top-10 right-10 p-4 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all z-20 group"
        >
          <X size={24} className="text-white/40 group-hover:text-white" />
        </button>

        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
          {/* Left: Intelligence Slants */}
          <div className="hidden lg:flex flex-col gap-6">
            <SlantCard
              icon={<Cpu size={16} />}
              label="Neural Status"
              value="Optimal"
              sub="Cognitive Atlas Synchronized"
            />
            <SlantCard
              icon={<ShieldAlert size={16} />}
              label="Divergence"
              value={data?.metrics.collisions || 0}
              sub="Active Collisions"
              urgent={data?.metrics.collisions ? data.metrics.collisions > 0 : false}
            />
            <SlantCard
              icon={<TrendingUp size={16} />}
              label="Mission Velocity"
              value={data?.metrics.velocity || 0}
              sub="Strategic Units / Pulse"
            />

            {forecast && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 bg-brand-500/5 border border-brand-500/20 rounded-[2.5rem] space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye size={14} className="text-brand-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      The Oracle
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${forecast.trajectory === 'POSITIVE' ? 'bg-emerald-500 shadow-glow-emerald' : 'bg-red-500 shadow-glow-red'}`}
                    />
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
                      {forecast.trajectory} Trajectory
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">
                      Confidence
                    </span>
                    <span className="text-[10px] font-black text-brand-400">
                      {(forecast.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${forecast.confidence * 100}%` }}
                      className="h-full bg-brand-500"
                    />
                  </div>
                </div>

                <p className="text-[11px] font-bold text-white uppercase tracking-tight italic leading-relaxed opacity-60">
                  "{forecast.prediction}"
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Est. Days
                    </span>
                    <p className="text-lg font-black text-white">
                      {forecast.metrics.completionDays}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Drift Index
                    </span>
                    <p
                      className={`text-lg font-black ${forecast.metrics.driftIndex > 0.5 ? 'text-red-400' : 'text-emerald-400'}`}
                    >
                      {forecast.metrics.driftIndex.toFixed(2)}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Center: Command Feed */}
          <div className="lg:col-span-2 space-y-12">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-500/10 rounded-lg">
                  <Terminal className="h-4 w-4 text-brand-500" />
                </div>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em]">
                  Command Nexus Active
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                {data?.missionName || 'Mission'}{' '}
                <span className="text-white/20 italic">Briefing</span>
              </h2>
            </div>

            <div className="relative min-h-[300px] p-8 rounded-[3rem] border border-brand-500/20 bg-brand-500/[0.02] shadow-glow-brand/5 overflow-hidden">
              {/* Animated Circuitry Background */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <Circuitry />
              </div>

              <div className="relative z-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse shadow-glow-brand" />
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                    Sitrep Synthesis
                  </span>
                </div>

                <div className="space-y-6">
                  <p className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight leading-relaxed italic border-l-4 border-brand-500 pl-8">
                    {displayText}
                    {isTyping && (
                      <span className="inline-block w-2 h-6 bg-brand-500 animate-pulse ml-2" />
                    )}
                  </p>

                  {!isTyping && data && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-6 pt-10"
                    >
                      <button className="px-8 py-4 bg-brand-500 rounded-2xl text-[10px] font-black text-white uppercase tracking-widest shadow-glow-brand hover:scale-105 transition-all">
                        Execute Directives
                      </button>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-4 w-1 rounded-full ${i < data.latestIntensity * 5 ? 'bg-brand-500' : 'bg-white/10'}`}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                          Pulse Intensity
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between py-6 px-4 bg-white/5 border border-white/10 rounded-3xl">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-brand-500/20 rounded-full flex items-center justify-center border border-brand-500/30">
                  <Zap className="h-5 w-5 text-brand-500 fill-brand-500" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest">
                    System Voice
                  </p>
                  <p className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em]">
                    Neural Synthesis Layer 4
                  </p>
                </div>
              </div>
              <Activity className="h-4 w-4 text-brand-500/40" />
            </div>
          </div>
        </div>
      </motion.div>
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

function Circuitry() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
      <path
        d="M0 20 L20 20 L30 30 L60 30 L70 40 L100 40"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="0.1"
      />
      <path
        d="M0 60 L40 60 L50 70 L80 70 L90 80 L100 80"
        fill="transparent"
        stroke="currentColor"
        strokeWidth="0.1"
      />
      <circle cx="20" cy="20" r="0.5" fill="currentColor" />
      <circle cx="60" cy="30" r="0.5" fill="currentColor" />
      <circle cx="50" cy="70" r="0.5" fill="currentColor" />
    </svg>
  );
}

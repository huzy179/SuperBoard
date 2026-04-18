'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, ChevronRight, ChevronLeft, Layers } from 'lucide-react';

interface TimelinePulse {
  id: string;
  date: string;
  intensity: number;
  narrative: string;
  events: {
    id: string;
    type: string;
    title: string;
    actor: string;
    time: string;
  }[];
}

export function MissionTimeline({ projectId }: { projectId: string }) {
  const [pulses, setPulses] = useState<TimelinePulse[]>([]);
  const [selectedPulse, setSelectedPulse] = useState<TimelinePulse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/v1/projects/${projectId}/chronology`)
      .then((res) => res.json())
      .then((res) => {
        setPulses(res.data);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [projectId]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (isLoading) return <TimelineSkeleton />;
  if (pulses.length === 0) return null;

  return (
    <div className="space-y-12 py-16 relative overflow-hidden">
      {/* Background Atmospheric Pulse */}
      <div className="absolute inset-0 bg-brand-500/[0.01] pointer-events-none" />

      <div className="flex items-center justify-between px-8 relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 flex items-center justify-center bg-brand-500/5 rounded-[1.5rem] border border-brand-500/10 shadow-glow-brand/5 group">
            <History className="h-6 w-6 text-brand-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="space-y-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.6em] text-white/10 italic">
              MISSION_CHRONOLOGY
            </h2>
            <p className="text-2xl font-black text-white uppercase tracking-tighter italic">
              TEMPORAL PULSE TRACK{' '}
              <span className="text-brand-500/40 font-mono text-sm ml-2">V7.4</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => scroll('left')}
            className="w-12 h-12 flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all active:scale-95 shadow-inner group"
          >
            <ChevronLeft size={20} className="text-white/20 group-hover:text-white" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-12 h-12 flex items-center justify-center bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all active:scale-95 shadow-inner group"
          >
            <ChevronRight size={20} className="text-white/20 group-hover:text-white" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* The Track with Gradient Masks */}
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-950 to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-950 to-transparent z-20 pointer-events-none" />

        <div
          ref={scrollContainerRef}
          className="flex gap-20 overflow-x-auto pb-20 pt-12 px-32 elite-scrollbar"
        >
          {pulses.map((pulse, i) => (
            <TimelineNode
              key={pulse.id}
              pulse={pulse}
              isSelected={selectedPulse?.id === pulse.id}
              onClick={() => setSelectedPulse(pulse)}
              isLast={i === pulses.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Selected Pulse Detail - Neural Manifest */}
      <AnimatePresence mode="wait">
        {selectedPulse && (
          <motion.div
            key={selectedPulse.id}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="mx-8 p-12 rounded-[4rem] border border-white/5 bg-white/[0.01] backdrop-blur-[40px] shadow-luxe grid grid-cols-1 lg:grid-cols-3 gap-16 relative overflow-hidden group"
          >
            {/* Internal Rim Light */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

            <div className="lg:col-span-2 space-y-10">
              <div className="flex items-center gap-6">
                <div className="px-6 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full shadow-inner">
                  <span className="text-[11px] font-black text-brand-400 uppercase tracking-[0.3em]">
                    STAMP_{selectedPulse.date.toUpperCase()}
                  </span>
                </div>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Brain className="text-brand-500/40" size={18} />
                  <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                    AI_SYNTHESIS_RECON
                  </span>
                </div>
                <p className="text-3xl font-black text-white uppercase tracking-tighter leading-tight italic border-l-[6px] border-brand-500 pl-10 py-4 bg-gradient-to-r from-brand-500/5 to-transparent rounded-r-3xl">
                  "{selectedPulse.narrative}"
                </p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <Layers className="text-indigo-500/40" size={18} />
                <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.5em]">
                  TACTICAL_SIGNALS
                </span>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-6 elite-scrollbar">
                {selectedPulse.events.map((event) => (
                  <div
                    key={event.id}
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-[1.5rem] flex items-start gap-5 group/event hover:border-white/10 hover:bg-white/[0.04] transition-all duration-500"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/10 group-hover/event:shadow-glow-indigo/20 transition-all">
                      <Layers size={16} />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-black text-white/80 uppercase tracking-tight italic">
                        {event.title}
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest leading-none">
                          {event.actor.toUpperCase()}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-white/5" />
                        <span className="text-[9px] font-bold text-brand-500/40 uppercase tracking-widest leading-none">
                          {event.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimelineNode({
  pulse,
  isSelected,
  onClick,
  isLast,
}: {
  pulse: TimelinePulse;
  isSelected: boolean;
  onClick: () => void;
  isLast: boolean;
}) {
  return (
    <div className="flex-shrink-0 relative flex items-center group">
      {/* Dynamic Connecting Segment */}
      {!isLast && (
        <div
          className={`absolute left-1/2 top-1/2 w-[220%] h-[2px] transition-all duration-1000 ${isSelected ? 'bg-gradient-to-r from-brand-500 to-indigo-500/20 shadow-glow-brand/20' : 'bg-white/5 opacity-40'}`}
        />
      )}

      <button
        onClick={onClick}
        className="relative flex flex-col items-center gap-8 z-10 transition-all duration-700"
      >
        <div className="flex flex-col items-center">
          <span
            className={`text-[10px] font-black uppercase tracking-[0.3em] mb-4 transition-all duration-500 ${isSelected ? 'text-brand-400 scale-110' : 'text-white/10 group-hover:text-white/30'}`}
          >
            {pulse.date.split('-').slice(1).join('_')}
          </span>

          {/* The Neural Pulse Core */}
          <div className="relative h-16 w-16 flex items-center justify-center">
            {/* Visual Scaling based on intensity */}
            <motion.div
              animate={{
                scale: isSelected ? [1, 1.2, 1] : [1, 1.1, 1],
                opacity: isSelected ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
              }}
              transition={{ duration: isSelected ? 1.5 : 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full blur-[30px] transition-all duration-1000 pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${pulse.intensity > 0.5 ? '#6366f1' : '#818cf8'}, transparent)`,
              }}
            />

            <div
              className={`
                   relative h-3.5 w-3.5 rounded-full border-[3px] transition-all duration-700
                   ${
                     isSelected
                       ? 'bg-white border-white scale-[1.8] shadow-glow-white ring-[12px] ring-brand-500/20'
                       : 'bg-brand-500/40 border-brand-500/40 shadow-glow-brand/10 group-hover:scale-110 group-hover:border-brand-500'
                   }
                `}
            />

            {isSelected && (
              <motion.div
                layoutId="pulse-ring"
                className="absolute -inset-4 border-2 border-brand-500/40 rounded-full shadow-glow-brand/5"
              />
            )}
          </div>
        </div>

        <div
          className={`px-6 py-3 rounded-2xl border transition-all duration-700 backdrop-blur-md ${isSelected ? 'border-brand-500/40 bg-brand-500/10 scale-110 shadow-luxe' : 'bg-white/[0.01] border-white/5 group-hover:bg-white/[0.03] group-hover:border-white/10'}`}
        >
          <span
            className={`text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${isSelected ? 'text-white' : 'text-white/20'}`}
          >
            {pulse.events.length} SIGNALS
          </span>
        </div>
      </button>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-12 py-16 animate-pulse px-8">
      <div className="flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-white/5 rounded-full" />
          <div className="h-8 w-64 bg-white/5 rounded-xl" />
        </div>
        <div className="flex gap-4">
          <div className="h-12 w-12 bg-white/5 rounded-2xl" />
          <div className="h-12 w-12 bg-white/5 rounded-2xl" />
        </div>
      </div>
      <div className="flex gap-20 px-32 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center gap-8 flex-shrink-0">
            <div className="h-4 w-12 bg-white/5 rounded-full" />
            <div className="h-16 w-16 bg-white/5 rounded-full" />
            <div className="h-10 w-24 bg-white/5 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

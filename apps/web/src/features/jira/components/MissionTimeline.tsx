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
    <div className="space-y-8 py-10">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-glow-indigo/10">
            <History className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Mission Chronology
            </h2>
            <p className="text-sm font-bold text-white uppercase tracking-tight">
              Temporal Pulse Track
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
          >
            <ChevronLeft size={16} className="text-white/40" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all"
          >
            <ChevronRight size={16} className="text-white/40" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* The Track */}
        <div
          ref={scrollContainerRef}
          className="flex gap-12 overflow-x-auto pb-12 pt-8 px-12 no-scrollbar mask-fade-edges"
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

      {/* Selected Pulse Detail */}
      <AnimatePresence mode="wait">
        {selectedPulse && (
          <motion.div
            key={selectedPulse.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 p-8 rounded-[2.5rem] border border-brand-500/20 bg-brand-500/[0.02] backdrop-blur-3xl grid grid-cols-1 md:grid-cols-3 gap-12"
          >
            <div className="md:col-span-2 space-y-6">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-brand-500/10 border border-brand-500/20 rounded-full">
                  <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">
                    {selectedPulse.date}
                  </span>
                </div>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  AI Synthesis
                </span>
                <p className="text-xl font-black text-white uppercase tracking-tight leading-relaxed italic border-l-4 border-brand-500 pl-6 py-2">
                  "{selectedPulse.narrative}"
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                Tactical Signals
              </span>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                {selectedPulse.events.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-start gap-4 group hover:border-white/10 transition-all"
                  >
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Layers size={12} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-white uppercase leading-none">
                        {event.title}
                      </p>
                      <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest leading-none">
                        {event.actor} • {event.time}
                      </p>
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
      {/* Connecting Segment */}
      {!isLast && (
        <div className="absolute left-1/2 top-1/2 w-[150%] h-[1px] bg-gradient-to-r from-brand-500/40 to-indigo-500/40 opacity-20" />
      )}

      <button onClick={onClick} className="relative flex flex-col items-center gap-6 z-10">
        <div className="flex flex-col items-center">
          <span className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2 group-hover:text-white/40 transition-colors">
            {pulse.date.split('-').slice(1).join('/')}
          </span>

          {/* The Actual Pulse */}
          <div className="relative h-12 w-12 flex items-center justify-center">
            {/* Visual Scaling based on intensity */}
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full blur-xl transition-all duration-700"
              style={{
                background: `radial-gradient(circle, ${pulse.intensity > 0.5 ? '#6366f1' : '#818cf8'}, transparent)`,
                opacity: pulse.intensity * 0.4,
                transform: `scale(${1 + pulse.intensity})`,
              }}
            />

            <div
              className={`
                   relative h-3 w-3 rounded-full border-2 transition-all duration-500
                   ${isSelected ? 'bg-white border-white scale-150 shadow-glow-current ring-8 ring-brand-500/20' : 'bg-brand-500/40 border-brand-500 shadow-glow-brand'}
                `}
            />

            {isSelected && (
              <motion.div
                layoutId="pulse-ring"
                className="absolute -inset-2 border border-brand-500 rounded-full"
              />
            )}
          </div>
        </div>

        <div
          className={`px-4 py-2 bg-white/[0.03] border border-white/5 rounded-xl transition-all duration-500 ${isSelected ? 'border-brand-500/40 bg-brand-500/10' : 'group-hover:bg-white/[0.06]'}`}
        >
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest whitespace-nowrap">
            {pulse.events.length} Signals
          </span>
        </div>
      </button>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-8 py-10 animate-pulse">
      <div className="flex justify-between px-4">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-10 bg-white/5 rounded-xl" />
          <div className="h-10 w-10 bg-white/5 rounded-xl" />
        </div>
      </div>
      <div className="flex gap-12 px-12">
        <div className="h-24 w-32 bg-white/5 rounded-xl flex-shrink-0" />
        <div className="h-24 w-32 bg-white/5 rounded-xl flex-shrink-0" />
        <div className="h-24 w-32 bg-white/5 rounded-xl flex-shrink-0" />
      </div>
    </div>
  );
}

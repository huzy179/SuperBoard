'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cpu, Activity, Zap, Globe, ShieldCheck, BrainCircuit, Terminal } from 'lucide-react';

interface Thought {
  id: string;
  metadata: {
    thoughts: string[];
    timestamp: string;
  };
}

export function TheVoid({ onClose }: { onClose: () => void }) {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [activeThought, setActiveThought] = useState<string>('Đang khởi tạo ngữ cảnh AI...');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConsciousness = async () => {
      const res = await fetch(
        '/api/v1/automation/consciousness/stream?workspaceId=default-workspace',
      );
      const data = await res.json();
      setThoughts(data.data);
      if (data.data.length > 0) {
        setActiveThought(data.data[0].metadata.thoughts[0]);
      }
    };

    fetchConsciousness();
    const interval = setInterval(fetchConsciousness, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [thoughts]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[#020617] text-white overflow-hidden flex flex-col"
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f6_0%,transparent_100%)] animate-pulse" />
        <GridBackground />
      </div>

      <header className="relative z-10 flex items-center justify-between p-10 border-b border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-brand-500 rounded-2xl flex items-center justify-center shadow-glow-brand animate-pulse">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-[0.5em]">AI Workspace</h1>
            <p className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              Hệ thống tự trị cấp 5
            </p>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
              Toàn bộ hệ thống ổn định
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        <div className="col-span-1 border-r border-white/5 flex flex-col overflow-hidden bg-slate-950/50">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Terminal className="text-brand-500" size={16} />
              <h2 className="text-[12px] font-black uppercase tracking-widest">Luồng suy nghĩ</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-ping" />
              <span className="text-[8px] font-black text-brand-500 uppercase">
                Luồng trực tiếp
              </span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
            <AnimatePresence mode="popLayout">
              {thoughts.map((pulse) => (
                <motion.div
                  key={pulse.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 opacity-20">
                    <div className="h-[1px] flex-1 bg-white" />
                    <span className="text-[8px] font-black uppercase">
                      {new Date(pulse.metadata.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {pulse.metadata.thoughts.map((thought, tidx) => (
                    <p
                      key={tidx}
                      className="text-[11px] font-bold text-white/60 leading-relaxed italic border-l-2 border-brand-500/20 pl-4"
                    >
                      {thought}
                    </p>
                  ))}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="col-span-2 relative flex items-center justify-center p-20 overflow-hidden">
          <div className="relative w-full max-w-4xl aspect-video flex items-center justify-center">
            <Visualizer activeThought={activeThought} />
          </div>

          <div className="absolute bottom-10 inset-x-10 grid grid-cols-4 gap-6">
            <StatCard icon={<Cpu size={14} />} label="Tải Neural" value="12.4 TFLOPS" />
            <StatCard icon={<Activity size={14} />} label="Độ trễ Synaptic" value="2ms" />
            <StatCard icon={<Zap size={14} />} label="Năng lượng" value="Cao" />
            <StatCard icon={<Globe size={14} />} label="Phạm vi" value="Toàn cục" />
          </div>
        </div>
      </main>
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-2 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-white/20">
        {icon}
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-sm font-black text-white">{value}</p>
    </div>
  );
}

function Visualizer({ activeThought }: { activeThought: string }) {
  return (
    <div className="relative flex flex-col items-center justify-center space-y-12">
      <div className="relative h-64 w-64">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-brand-500/20 border-t-brand-500 shadow-glow-brand"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border-2 border-brand-300/10 border-b-brand-300"
        />
        <div className="absolute inset-8 rounded-full bg-brand-500/5 backdrop-blur-md flex items-center justify-center">
          <BrainCircuit size={64} className="text-brand-500 animate-pulse" />
        </div>
      </div>

      <div className="text-center space-y-4 max-w-xl">
        <motion.p
          key={activeThought}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-black text-white uppercase tracking-tighter leading-tight italic"
        >
          "{activeThought}"
        </motion.p>
        <div className="flex items-center justify-center gap-2">
          <div className="h-1 w-12 bg-brand-500" />
          <span className="text-[10px] font-black text-brand-400 uppercase tracking-[1em] pl-4">
            Đang xử lý
          </span>
        </div>
      </div>
    </div>
  );
}

function GridBackground() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

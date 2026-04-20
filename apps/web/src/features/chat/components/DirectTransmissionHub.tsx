'use client';

import { motion } from 'framer-motion';
import { PhoneOff, Mic, MicOff, Video, VideoOff, ShieldCheck, Activity, Wifi } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DirectTransmissionHubProps {
  channelName: string;
  onClose: () => void;
}

export function DirectTransmissionHub({ channelName, onClose }: DirectTransmissionHubProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [signalStrength, setSignalStrength] = useState(98);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignalStrength((prev) => Math.min(100, Math.max(92, prev + (Math.random() * 2 - 1))));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1, backdropFilter: 'blur(0px)' }}
      animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(40px)' }}
      exit={{ opacity: 0, scale: 0.9, backdropFilter: 'blur(0px)' }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-8"
    >
      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,_rgba(var(--brand-500-rgb),0.1),transparent_70%)]" />
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      <div className="relative w-full max-w-5xl aspect-video bg-slate-900/60 border border-white/10 rounded-[3rem] shadow-luxe overflow-hidden flex flex-col">
        {/* Top Status Bar */}
        <div className="p-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-brand-500/10 border border-brand-500/20 rounded-xl">
              <ShieldCheck className="text-brand-400" size={18} />
            </div>
            <div>
              <h2 className="text-[11px] font-black text-brand-400 uppercase tracking-[0.3em] mb-1 italic">
                Secure Peer Link Established
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xl font-black text-white uppercase tracking-tighter italic">
                  TRANSMISSION_{channelName.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                Signal Integrity
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-white font-mono">
                  {signalStrength.toFixed(1)}%
                </span>
                <Wifi size={16} className="text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Area */}
        <div className="flex-1 px-8 pb-32 flex gap-6 relative">
          {/* Active Speaker Node */}
          <div className="flex-1 rounded-[2.5rem] bg-black/40 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full border border-brand-500/20 animate-ping absolute inset-0" />
                <div className="h-32 w-32 rounded-full border border-brand-500/40 animate-ping absolute inset-0 [animation-delay:0.5s]" />
                <div className="h-32 w-32 rounded-[2rem] bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-3xl font-black text-white shadow-glow-brand/20 relative z-10">
                  JD
                </div>
              </div>
            </div>
            <div className="absolute bottom-6 left-6 flex items-center gap-3 px-4 py-2 bg-slate-900/80 backdrop-blur-xl rounded-xl border border-white/10">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">
                Main Uplink: JOHN DOE
              </span>
            </div>
          </div>

          {/* Sidebar Feeds */}
          <div className="w-64 flex flex-col gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-3xl bg-white/[0.02] border border-white/5 relative flex items-center justify-center group overflow-hidden"
              >
                <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/20 uppercase group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                  NODE_{i}
                </div>
                <div className="absolute top-3 right-3 h-1.5 w-1.5 rounded-full bg-white/10" />
              </div>
            ))}
          </div>

          {/* Waveform Animation */}
          <div className="absolute bottom-8 left-16 right-16 h-12 flex items-end gap-1 opacity-20">
            {Array.from({ length: 100 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ height: [4, Math.random() * 32 + 4, 4] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.01 }}
                className="flex-1 bg-brand-500 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Global Controls */}
        <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-4 p-2 bg-slate-900/90 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl pointer-events-auto">
            <ControlBtn
              active={isMuted}
              onClick={() => setIsMuted(!isMuted)}
              icon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              danger={isMuted}
            />
            <ControlBtn
              active={isVideoOff}
              onClick={() => setIsVideoOff(!isVideoOff)}
              icon={isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              danger={isVideoOff}
            />
            <div className="w-px h-8 bg-white/5 mx-2" />
            <button
              onClick={onClose}
              className="h-14 w-14 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-glow-rose/10 active:scale-95"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full">
          <div className="flex items-center gap-3">
            <Activity size={12} className="text-brand-400" />
            <span className="text-[9px] font-black text-white/60 uppercase tracking-[0.3em]">
              Encrypted Pulse Active
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ControlBtn({
  icon,
  active,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`h-14 w-14 rounded-full flex items-center justify-center transition-all border ${
        active
          ? danger
            ? 'bg-rose-500 text-white border-rose-400'
            : 'bg-brand-500 text-white border-brand-400'
          : 'bg-white/5 text-white animate-fade-in hover:bg-white/10 border-white/5'
      } active:scale-95`}
    >
      {icon}
    </button>
  );
}

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
      <div className="absolute inset-0 opacity-[0.01] pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20viewBox%3D%220%200%25%20256%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cfilter%20id%3D%22noiseFilter%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.8%22%20numOctaves%3D%224%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23noiseFilter)%22%2F%3E%3C%2Fsvg%3E')]" />

      <div className="relative w-full max-w-4xl aspect-video bg-slate-900/60 border border-white/10 rounded-md shadow-inner overflow-hidden flex flex-col backdrop-blur-2xl">
        {/* Top Status Bar */}
        <div className="p-8 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-sm">
              <ShieldCheck className="text-brand-400" size={16} />
            </div>
            <div>
              <h2 className="text-[9px] font-bold text-brand-400 uppercase tracking-widest mb-1">
                SECURE_PEER_LINK_ACTIVE
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-white uppercase tracking-tight">
                  UPLINK_{channelName.toUpperCase()}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-[8px] font-bold text-white/20 uppercase tracking-widest mb-1">
                SIGNAL_INTEGRITY
              </div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white font-mono">
                  {signalStrength.toFixed(1)}%
                </span>
                <Wifi size={14} className="text-emerald-500/50" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Feed Area */}
        <div className="flex-1 px-8 pb-32 flex gap-6 relative">
          {/* Active Speaker Node */}
          <div className="flex-1 rounded-sm bg-black/40 border border-white/5 relative overflow-hidden group">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full border border-brand-500/10 animate-ping absolute inset-0" />
                <div className="h-24 w-24 rounded-sm bg-gradient-to-br from-brand-600 to-brand-400 flex items-center justify-center text-2xl font-black text-white shadow-inner relative z-10">
                  JD
                </div>
              </div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-slate-950/80 backdrop-blur-2xl rounded-sm border border-white/10">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-glow-emerald animate-pulse" />
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                Source_Node: JOHN_DOE
              </span>
            </div>
          </div>

          {/* Sidebar Feeds */}
          <div className="w-48 flex flex-col gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-white/[0.01] border border-white/5 relative flex items-center justify-center group overflow-hidden"
              >
                <div className="h-10 w-10 rounded-xs bg-white/[0.02] flex items-center justify-center text-[9px] font-bold text-white/10 uppercase group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all border border-transparent group-hover:border-brand-500/20">
                  U_{i}
                </div>
                <div className="absolute top-2 right-2 h-1 w-1 rounded-full bg-white/5" />
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
        <div className="absolute bottom-0 inset-x-0 p-[var(--space-8)] flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-3 p-1.5 bg-slate-950/90 backdrop-blur-3xl border border-white/10 rounded-sm shadow-2xl pointer-events-auto">
            <ControlBtn
              active={isMuted}
              onClick={() => setIsMuted(!isMuted)}
              icon={isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              danger={isMuted}
            />
            <ControlBtn
              active={isVideoOff}
              onClick={() => setIsVideoOff(!isVideoOff)}
              icon={isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              danger={isVideoOff}
            />
            <div className="w-px h-6 bg-white/5 mx-1" />
            <button
              onClick={onClose}
              className="h-11 w-20 rounded-sm bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-inner active:scale-95"
            >
              <PhoneOff size={20} />
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
      className={`h-11 w-11 rounded-sm flex items-center justify-center transition-all border ${
        active
          ? danger
            ? 'bg-rose-500 text-white border-rose-400'
            : 'bg-brand-500 text-white border-brand-400'
          : 'bg-white/5 text-white/40 hover:bg-white/10 border-white/5'
      } active:scale-95`}
    >
      {icon}
    </button>
  );
}

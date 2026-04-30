'use client';

import { useEffect, useState } from 'react';
import { Activity, Mic, MicOff, PhoneOff, Video, VideoOff, Wifi } from 'lucide-react';

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
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-surface-border bg-surface-card shadow-luxe">
        <div className="flex items-start justify-between gap-4 border-b border-surface-border px-6 py-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Call</div>
            <div className="mt-1 text-sm text-[color:var(--color-muted)] truncate">
              Kênh: {channelName}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
            <Wifi size={16} className="text-[color:var(--color-faint)]" />
            {signalStrength.toFixed(1)}%
          </div>
        </div>

        <div className="p-6">
          <div className="aspect-video rounded-xl border border-surface-border bg-surface-bg flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-[color:var(--color-muted)]">
              <Activity size={18} className="text-[color:var(--color-faint)]" />
              <div className="text-sm">Đang kết nối audio/video…</div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <ToggleBtn
              active={isMuted}
              onClick={() => setIsMuted((v) => !v)}
              icon={isMuted ? <MicOff size={18} /> : <Mic size={18} />}
              label={isMuted ? 'Unmute' : 'Mute'}
            />
            <ToggleBtn
              active={isVideoOff}
              onClick={() => setIsVideoOff((v) => !v)}
              icon={isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              label={isVideoOff ? 'Video on' : 'Video off'}
            />
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <PhoneOff size={18} />
              Kết thúc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleBtn({
  icon,
  active,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-200 bg-brand-50 text-brand-700'
          : 'border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

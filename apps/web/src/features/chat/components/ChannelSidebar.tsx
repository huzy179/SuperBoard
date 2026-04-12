'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Hash, Lock, Plus, Cpu, Layers, Radio } from 'lucide-react';
import { useChannels } from '../hooks/use-chat';
import { useWorkspaces } from '@/features/workspace/hooks/use-workspaces';
import { AppBrand } from '@/components/layout/app-brand';

export function ChannelSidebar() {
  const params = useParams<{ channelId: string }>();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspace = workspaces?.[0]; // Default to first for now
  const { data: channels, isLoading } = useChannels(activeWorkspace?.id);

  return (
    <aside className="flex flex-col h-full w-72 bg-slate-950 border-r border-white/5 relative z-50 group">
      {/* Physical noise texture proxy */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100" />

      <div className="p-6 border-b border-white/5 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full translate-x-12 -translate-y-12" />
        <AppBrand subtitle="Neural Hub" variant="dark" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-8 space-y-10 scrollbar-none relative">
        {/* Navigation Category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3 group/cat">
            <div className="flex items-center gap-2">
              <Radio size={12} className="text-brand-500 animate-pulse" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 group-hover/cat:text-brand-400 transition-colors">
                Sector Control
              </span>
            </div>
            <button className="p-1.5 rounded-lg bg-white/5 border border-white/5 text-white/20 hover:text-white hover:bg-brand-500 transition-all opacity-0 group-hover/cat:opacity-100">
              <Plus size={12} />
            </button>
          </div>

          <nav className="space-y-1">
            {isLoading ? (
              <div className="px-3 py-2 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 bg-white/5 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : (
              channels?.map((channel) => {
                const isActive = params.channelId === channel.id;
                return (
                  <Link
                    key={channel.id}
                    href={`/chat/${channel.id}`}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl text-[13px] font-black uppercase tracking-tight transition-all group/item relative overflow-hidden border ${
                      isActive
                        ? 'bg-brand-500/10 border-brand-500/20 text-white shadow-glow-brand/5'
                        : 'border-transparent text-white/30 hover:bg-white/[0.03] hover:text-white hover:border-white/5'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-3 bottom-3 w-1 bg-brand-500 rounded-r-full shadow-glow-brand" />
                    )}

                    <span
                      className={`p-1.5 rounded-lg border transition-all ${isActive ? 'bg-brand-500/20 border-brand-500/30 text-brand-400' : 'bg-white/5 border-white/5 text-white/20 group-hover/item:text-brand-400/60'}`}
                    >
                      {channel.type === 'PUBLIC' ? <Hash size={14} /> : <Lock size={14} />}
                    </span>
                    <span className="truncate flex-1 tracking-wider">{channel.name}</span>

                    {isActive && (
                      <div className="flex gap-1 items-center">
                        <div className="h-1.5 w-1.5 rounded-full bg-brand-400/40 animate-ping" />
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </nav>
        </div>

        {/* Private Data Category */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-3 group/cat">
            <div className="flex items-center gap-2">
              <Layers size={12} className="text-indigo-500" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30 group-hover/cat:text-indigo-400 transition-colors">
                Operative Link
              </span>
            </div>
          </div>

          <div className="px-3 space-y-4">
            <div className="p-5 rounded-[2rem] border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center group/empty">
              <Cpu
                size={24}
                className="text-white/5 mb-3 group-hover/empty:text-brand-500/20 transition-colors"
              />
              <p className="text-[9px] font-black text-white/10 uppercase tracking-widest leading-relaxed">
                Awaiting encrypted
                <br />
                peer link...
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Controller Footer */}
      <div className="p-6 border-t border-white/5 bg-black/40 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-brand-500/5 blur-3xl rounded-full -translate-x-16 -translate-y-16" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="relative group/avatar">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-brand-600 to-brand-400 border border-brand-500/30 flex items-center justify-center text-white text-sm font-black shadow-glow-brand/10 group-hover/avatar:scale-110 transition-transform">
              {activeWorkspace?.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-slate-950 rounded-full border-2 border-slate-950">
              <div className="h-full w-full bg-emerald-500 rounded-full animate-pulse shadow-glow-emerald" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white uppercase tracking-wider truncate">
              {activeWorkspace?.name}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-brand-400/60 uppercase tracking-widest">
                Premium Node
              </span>
              <div className="h-1 w-1 bg-white/10 rounded-full" />
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

import { useState, useEffect } from 'react';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThreadPanel } from './ThreadPanel';
import { ChannelSidebar } from './ChannelSidebar';
import { chatSocket } from '@/lib/realtime/chat-socket';
import { Hash, Lock, Users, Search, MoreVertical } from 'lucide-react';
import type { Channel, Message } from '@superboard/shared';

interface ChatShellProps {
  channel: Channel;
}

export function ChatShell({ channel }: ChatShellProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeThread, setActiveThread] = useState<Message | null>(null);

  useEffect(() => {
    const unsubscribe = chatSocket.onTyping((data) => {
      if (data.channelId === channel.id) {
        setTypingUsers((prev) => {
          if (data.isTyping) {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          } else {
            return prev.filter((id) => id !== data.userId);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [channel.id]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 animate-in fade-in duration-700">
      <ChannelSidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Elite Protocol Header */}
        <header className="flex h-16 shrink-0 items-center justify-between px-8 bg-slate-950/80 backdrop-blur-3xl border-b border-white/5 sticky top-0 z-40">
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-xl border ${channel.type === 'PUBLIC' ? 'bg-brand-500/10 border-brand-500/20 shadow-glow-brand/5' : 'bg-amber-500/10 border-amber-500/20 shadow-glow-amber/5'}`}
            >
              {channel.type === 'PUBLIC' ? (
                <Hash className="h-4 w-4 text-brand-400" />
              ) : (
                <Lock className="h-4 w-4 text-amber-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black text-white uppercase tracking-wider">
                  {channel.name}
                </h1>
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
              </div>
              {channel.description && (
                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest truncate max-w-md">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[10px] font-black text-white/40"
                >
                  U{i}
                </div>
              ))}
              <div className="h-7 w-7 rounded-full border-2 border-slate-950 bg-brand-500/20 flex items-center justify-center text-[10px] font-black text-brand-400">
                +9
              </div>
            </div>

            <div className="h-4 w-px bg-white/5" />

            <div className="flex items-center gap-4 text-white/40">
              <button className="p-2 hover:text-white transition-all group relative">
                <Search size={18} />
                <div className="absolute inset-0 bg-brand-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform" />
              </button>
              <button className="p-2 hover:text-white transition-all group relative">
                <Users size={18} />
                <div className="absolute inset-0 bg-brand-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform" />
              </button>
              <button className="p-2 hover:text-white transition-all group relative">
                <MoreVertical size={18} />
                <div className="absolute inset-0 bg-brand-500/10 rounded-lg scale-0 group-hover:scale-100 transition-transform" />
              </button>
            </div>
          </div>
        </header>

        {/* Transmission Interface */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-h-0 bg-[radial-gradient(circle_at_50%_0%,_rgba(var(--brand-500-rgb),0.03),transparent_40%)]">
            <MessageList channelId={channel.id} onOpenThread={setActiveThread} />

            {/* Neural Load Indicator */}
            <div className="px-8 flex items-center gap-3 h-8 bg-slate-950/20 backdrop-blur-sm">
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <div className="flex gap-1">
                    <div className="h-1 w-1 rounded-full bg-brand-500 animate-bounce" />
                    <div className="h-1 w-1 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                    <div className="h-1 w-1 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[9px] font-black text-brand-400/60 uppercase tracking-widest italic">
                    {channel.name} đang nhập...
                  </span>
                </div>
              )}
            </div>

            <div className="px-8 pb-8 pt-2">
              <MessageInput channelId={channel.id} />
              <div className="mt-4 flex items-center justify-center gap-6 opacity-20 group">
                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">
                  v4.2.0
                </span>
              </div>
            </div>
          </div>

          {activeThread && (
            <div className="w-[450px] border-l border-white/5 bg-slate-950/50 backdrop-blur-3xl animate-in slide-in-from-right-8 fade-in duration-500 shadow-2xl relative z-50">
              <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent pointer-events-none" />
              <ThreadPanel parentMessage={activeThread} onClose={() => setActiveThread(null)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

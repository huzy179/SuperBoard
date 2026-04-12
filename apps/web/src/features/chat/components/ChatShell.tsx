'use client';

import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ThreadPanel } from './ThreadPanel';
import { chatSocket } from '@/lib/realtime/chat-socket';
import { Hash, Lock, Users, Settings, Search } from 'lucide-react';
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
    <div className="flex h-full w-full overflow-hidden bg-slate-50/50">
      <ChannelSidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full relative border-l border-slate-100">
        <header className="flex h-14 shrink-0 items-center justify-between px-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-slate-400">
              {channel.type === 'PUBLIC' ? <Hash size={18} /> : <Lock size={18} />}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-none">{channel.name}</h1>
              {channel.description && (
                <p className="mt-1 text-[11px] text-slate-400 truncate max-w-md">
                  {channel.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 transition-colors text-[12px] font-bold">
              <Users size={16} />
              <span>12</span>
            </div>
            <div className="w-px h-4 bg-slate-200" />
            <button className="p-1 hover:text-slate-600 transition-colors">
              <Search size={18} />
            </button>
            <button className="p-1 hover:text-slate-600 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          <div className="flex-1 flex flex-col min-h-0 bg-transparent">
            <MessageList channelId={channel.id} onOpenThread={setActiveThread} />

            <div className="px-6 py-1 h-5">
              {typingUsers.length > 0 && (
                <p className="text-[11px] text-slate-400 italic animate-pulse">
                  Ai đó đang soạn tin nhắn...
                </p>
              )}
            </div>

            <MessageInput channelId={channel.id} />
          </div>

          {activeThread && (
            <div className="w-96 border-l border-slate-200 bg-white/80 backdrop-blur-xl animate-in slide-in-from-right-8 fade-in duration-500 shadow-2xl relative z-30">
              <ThreadPanel parentMessage={activeThread} onClose={() => setActiveThread(null)} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

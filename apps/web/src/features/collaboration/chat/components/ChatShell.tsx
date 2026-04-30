'use client';

import { useEffect, useState } from 'react';
import { Hash, Lock, MoreVertical, Phone, Search, Users } from 'lucide-react';
import type { Channel, Message } from '@superboard/shared';
import { chatSocket } from '@/lib/realtime/chat-socket';
import { ChannelSidebar } from './ChannelSidebar';
import { DirectTransmissionHub } from './DirectTransmissionHub';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { ThreadPanel } from './ThreadPanel';

interface ChatShellProps {
  channel: Channel;
}

export function ChatShell({ channel }: ChatShellProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [activeThread, setActiveThread] = useState<Message | null>(null);
  const [showTransmission, setShowTransmission] = useState(false);

  useEffect(() => {
    const unsubscribe = chatSocket.onTyping((data) => {
      if (data.channelId !== channel.id) return;
      setTypingUsers((prev) => {
        if (data.isTyping) return prev.includes(data.userId) ? prev : [...prev, data.userId];
        return prev.filter((id) => id !== data.userId);
      });
    });

    return () => unsubscribe();
  }, [channel.id]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-bg">
      <ChannelSidebar />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-surface-border bg-surface-card">
          <div className="flex h-14 items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)]">
                {channel.type === 'PUBLIC' ? <Hash size={16} /> : <Lock size={16} />}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                  {channel.name}
                </div>
                {channel.description ? (
                  <div className="truncate text-xs text-[color:var(--color-muted)]">
                    {channel.description}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <IconBtn onClick={() => setShowTransmission(true)} label="Call">
                <Phone size={16} />
              </IconBtn>
              <IconBtn onClick={() => {}} label="Search">
                <Search size={16} />
              </IconBtn>
              <IconBtn onClick={() => {}} label="Members">
                <Users size={16} />
              </IconBtn>
              <IconBtn onClick={() => {}} label="More">
                <MoreVertical size={16} />
              </IconBtn>
            </div>
          </div>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <MessageList channelId={channel.id} onOpenThread={setActiveThread} />

            {typingUsers.length > 0 ? (
              <div className="px-6 py-2 text-xs text-[color:var(--color-muted)] border-t border-surface-border bg-surface-card">
                Đang nhập…
              </div>
            ) : null}

            <div className="px-6 pb-6 pt-3 bg-surface-bg">
              <MessageInput channelId={channel.id} />
            </div>
          </div>

          {activeThread ? (
            <aside className="w-[420px] shrink-0 border-l border-surface-border bg-surface-card shadow-luxe">
              <ThreadPanel parentMessage={activeThread} onClose={() => setActiveThread(null)} />
            </aside>
          ) : null}
        </div>

        {showTransmission ? (
          <DirectTransmissionHub
            channelName={channel.name}
            onClose={() => setShowTransmission(false)}
          />
        ) : null}
      </main>
    </div>
  );
}

function IconBtn({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

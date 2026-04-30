'use client';

import { useEffect, useState, useRef } from 'react';
import { Cpu, Terminal } from 'lucide-react';
import { getConsciousnessStream } from '../api/automation-service';
import { AppOverlay } from '@/components/ui/app-overlay';

interface Thought {
  id: string;
  metadata: {
    thoughts: string[];
    timestamp: string;
  };
}

export function TheVoid({
  isOpen,
  onClose,
  workspaceId,
}: {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string | null;
}) {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [activeThought, setActiveThought] = useState<string>('Đang khởi tạo ngữ cảnh AI...');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConsciousness = async () => {
      if (!workspaceId) return;
      setIsLoading(true);
      try {
        const data = await getConsciousnessStream(workspaceId);
        setThoughts(data);
        if (data.length > 0) {
          setActiveThought(data[0]?.metadata.thoughts[0] ?? 'Đang khởi tạo ngữ cảnh AI...');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (!isOpen) return;
    fetchConsciousness();
    const interval = setInterval(fetchConsciousness, 15000);
    return () => clearInterval(interval);
  }, [isOpen, workspaceId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [thoughts]);

  return (
    <AppOverlay
      isOpen={isOpen}
      onClose={onClose}
      title="Automation activity"
      subtitle="Nhật ký xử lý và các “thoughts” mà hệ thống ghi lại."
      variant="modal"
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <Terminal size={14} />
            <span>{isLoading ? 'Đang tải…' : 'Cập nhật mỗi 15s'}</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Đóng
          </button>
        </div>
      }
    >
      {!workspaceId ? (
        <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 text-sm text-[color:var(--color-muted)]">
          Chưa xác định workspace.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <section className="lg:col-span-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
              <Cpu size={16} className="text-[color:var(--color-muted)]" />
              Luồng sự kiện
            </div>
            <div
              ref={scrollRef}
              className="mt-3 max-h-[60vh] overflow-y-auto rounded-lg border border-surface-border bg-surface-card"
            >
              {thoughts.length === 0 ? (
                <div className="p-4 text-sm text-[color:var(--color-muted)]">Chưa có dữ liệu.</div>
              ) : (
                <div className="divide-y divide-[color:var(--color-surface-border)]">
                  {thoughts.map((pulse) => {
                    const first = pulse.metadata.thoughts[0] ?? '';
                    const ts = new Date(pulse.metadata.timestamp);
                    return (
                      <button
                        key={pulse.id}
                        type="button"
                        onClick={() => setActiveThought(first || activeThought)}
                        className="w-full text-left px-4 py-3 hover:bg-black/[0.02] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-medium text-[color:var(--color-muted)]">
                            {ts.toLocaleTimeString()}
                          </span>
                          <span className="text-xs text-[color:var(--color-faint)]">
                            {ts.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-[color:var(--color-ink)] line-clamp-2">
                          {first || '—'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="lg:col-span-2">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Chi tiết</div>
            <div className="mt-3 rounded-lg border border-surface-border bg-surface-card p-4 shadow-glass">
              <p className="text-sm leading-relaxed text-[color:var(--color-ink)]">
                {activeThought}
              </p>
            </div>
            <p className="mt-3 text-xs text-[color:var(--color-muted)] leading-relaxed">
              Giao diện này được giản lược để dễ đọc, không dùng nền tối/glow/blur.
            </p>
          </section>
        </div>
      )}
    </AppOverlay>
  );
}

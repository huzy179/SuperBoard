'use client';

import { useCallback, useEffect, useState } from 'react';
import { Activity, CheckCircle2, RefreshCcw, Sunrise, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AppOverlay } from '@/components/ui/app-overlay';
import { getDailyBriefing } from '../api/executive-service';

interface BriefingData {
  pulse: string;
  commandIntent: string[];
  highlights: string[];
}

export function MorningBriefing({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<BriefingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBriefing = useCallback(async () => {
    setIsLoading(true);
    try {
      setData(await getDailyBriefing(workspaceId));
    } catch {
      toast.error('Không thể tải báo cáo buổi sáng');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchBriefing());
  }, [fetchBriefing]);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AppOverlay
      isOpen
      onClose={onClose}
      title="Daily briefing"
      subtitle={today}
      variant="modal"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => fetchBriefing()}>
            <RefreshCcw size={16} />
            Làm mới
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Đã hiểu
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <RefreshCcw size={16} className="animate-spin" />
          Đang tải…
        </div>
      ) : !data ? (
        <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 text-sm text-[color:var(--color-muted)]">
          Không có dữ liệu.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-glass">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
              <Sunrise size={16} className="text-brand-600" />
              Tình trạng hoạt động
            </div>
            <p className="mt-3 text-sm text-[color:var(--color-ink)] leading-relaxed">
              “{data.pulse}”
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                Stable
              </span>
              <span className="inline-flex items-center rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-xs font-medium text-[color:var(--color-muted)]">
                Sync active
              </span>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-glass">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
                <Target size={16} className="text-brand-600" />
                Mục tiêu hôm nay
              </div>
              <div className="mt-4 space-y-2">
                {data.commandIntent.map((intent, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-surface-border bg-black/[0.02] px-3 py-2"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-surface-card text-xs font-semibold text-[color:var(--color-muted)]">
                      {index + 1}
                    </span>
                    <p className="text-sm text-[color:var(--color-ink)] leading-relaxed">
                      {intent}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-glass">
              <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
                <Zap size={16} className="text-brand-600" />
                Điểm nổi bật
              </div>
              <div className="mt-4 space-y-2">
                {data.highlights.map((h, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-surface-border bg-black/[0.02] text-[color:var(--color-muted)]">
                      <CheckCircle2 size={12} />
                    </span>
                    <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">{h}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
            <Activity size={14} />
            Báo cáo được tối giản để dễ đọc, ít hiệu ứng.
          </div>
        </div>
      )}
    </AppOverlay>
  );
}

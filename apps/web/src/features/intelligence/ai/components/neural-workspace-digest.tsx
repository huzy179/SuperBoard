'use client';

import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getWorkspaceDigest } from '../api/ai-service';
import { AppButton } from '@/components/ui/app-button';

interface NeuralWorkspaceDigestProps {
  workspaceId: string;
}

export function NeuralWorkspaceDigest({ workspaceId }: NeuralWorkspaceDigestProps) {
  const [digest, setDigest] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDigest = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await getWorkspaceDigest(workspaceId);
      setDigest(data.digest);
    } catch {
      toast.error('Không thể đồng bộ AI');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDigest();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="w-full rounded-xl border border-surface-border bg-surface-card shadow-luxe p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-500/15" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-32 bg-black/[0.05] rounded" />
            <div className="h-3 w-48 bg-black/[0.05] rounded" />
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-4 w-full bg-black/[0.04] rounded" />
          <div className="h-4 w-[92%] bg-black/[0.04] rounded" />
          <div className="h-4 w-[78%] bg-black/[0.04] rounded" />
        </div>
      </div>
    );
  }

  return (
    <section className="w-full rounded-xl border border-surface-border bg-surface-card shadow-luxe p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 border border-brand-500/15 text-brand-500">
            <Sparkles size={18} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Tóm tắt AI</h3>
            <p className="text-sm text-[color:var(--color-muted)]">
              Tổng hợp nhanh hoạt động của workspace
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:justify-end">
          <div className="inline-flex items-center gap-2 rounded-full border border-surface-border bg-black/[0.02] px-3 py-1.5 text-xs text-[color:var(--color-muted)]">
            <Clock size={12} />
            <span>Generated {new Date().toLocaleTimeString()}</span>
          </div>
          <AppButton
            onClick={() => fetchDigest(true)}
            disabled={isRefreshing}
            isLoading={isRefreshing}
            variant="secondary"
            size="md"
            leftIcon={<RefreshCw size={14} />}
          >
            Đồng bộ
          </AppButton>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/40 p-5">
        <p className="text-base leading-relaxed text-[color:var(--color-ink)]">
          {digest || 'Đang phân tích dữ liệu hoạt động...'}
        </p>
      </div>
    </section>
  );
}

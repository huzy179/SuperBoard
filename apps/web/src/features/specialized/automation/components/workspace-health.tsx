'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Clock,
  GitMerge,
  Heart,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAutomationHealth, healWorkspace, type HealthAction } from '../api/automation-service';

export function WorkspaceHealth({ workspaceId }: { workspaceId: string }) {
  const [actions, setActions] = useState<HealthAction[]>([]);
  const [isHealing, setIsHealing] = useState(false);

  const fetchHealth = useCallback(async () => {
    try {
      const body = await getAutomationHealth(workspaceId);
      setActions(body.actions);
    } catch {
      toast.error('Không tải được trạng thái Workspace Health');
    }
  }, [workspaceId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchHealth());
  }, [fetchHealth]);

  const handleHeal = async () => {
    setIsHealing(true);
    try {
      const body = await healWorkspace(workspaceId);
      toast.success(`Hoàn tất: ${body.archived} mục đã được lưu trữ.`);
      await fetchHealth();
    } catch {
      toast.error('Chạy dọn dẹp thất bại');
    } finally {
      setIsHealing(false);
    }
  };

  const redundancyActions = useMemo(
    () => actions.filter((a) => a.actionType === 'SUGGEST_MERGE'),
    [actions],
  );
  const archivalActions = useMemo(
    () => actions.filter((a) => a.actionType === 'AUTO_ARCHIVE'),
    [actions],
  );

  return (
    <section className="rounded-xl border border-surface-border bg-surface-card shadow-luxe p-6 space-y-6 font-sans">
      <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center">
            <Heart size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--color-ink)] tracking-tight">
              Workspace health
            </h2>
            <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              Gợi ý dọn dẹp và các sự kiện tự động để workspace gọn gàng, dễ dùng.
            </p>
          </div>
        </div>

        <button type="button" onClick={handleHeal} disabled={isHealing} className="btn btn-primary">
          {isHealing ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
          {isHealing ? 'Đang chạy…' : 'Chạy dọn dẹp'}
        </button>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Gợi ý</h3>
            <span className="text-sm text-[color:var(--color-muted)]">
              {redundancyActions.length} mục có thể gộp
            </span>
          </div>

          {redundancyActions.length > 0 ? (
            <div className="space-y-3">
              {redundancyActions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-xl border border-surface-border bg-surface-card p-5 shadow-glass space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 flex items-center justify-center">
                        <GitMerge size={18} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                          Khuyến nghị gộp
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--color-muted)] tabular-nums">
                          Ref: {action.targetId.slice(0, 8)}
                        </div>
                      </div>
                    </div>
                    <button type="button" className="btn btn-secondary px-3" title="Xem chi tiết">
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                    {action.reason}
                  </p>

                  <div className="flex items-center gap-2">
                    <button type="button" className="btn btn-primary">
                      Thực hiện gộp
                    </button>
                    <button type="button" className="btn btn-secondary">
                      Bỏ qua
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border bg-black/[0.02] p-10 text-center">
              <ShieldCheck size={36} className="mx-auto text-[color:var(--color-faint)]" />
              <p className="mt-3 text-sm font-medium text-[color:var(--color-muted)]">
                Không phát hiện trùng lặp.
              </p>
            </div>
          )}
        </section>

        <section className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-[color:var(--color-ink)]">Nhịp dọn dẹp</h3>
            <span className="text-sm text-[color:var(--color-muted)] tabular-nums">
              {actions.length} events
            </span>
          </div>

          <div className="rounded-xl border border-surface-border bg-black/[0.02] p-5 max-h-[540px] overflow-auto scrollbar-hide space-y-4">
            {archivalActions.length > 0 ? (
              archivalActions.map((action) => (
                <div key={action.id} className="flex items-start gap-3">
                  <div className="mt-0.5 w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-center shrink-0">
                    <Clock size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                        Auto archive
                      </span>
                      <span className="text-xs text-[color:var(--color-faint)] tabular-nums">
                        {new Date(action.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                      “{action.reason}”
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <Trash2 size={32} className="mx-auto text-[color:var(--color-faint)]" />
                <p className="mt-3 text-sm text-[color:var(--color-muted)]">
                  Chưa có sự kiện dọn dẹp.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

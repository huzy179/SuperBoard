'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Fingerprint, Loader2, ShieldAlert } from 'lucide-react';
import { executeExecutiveDirective, getExecutiveDirective } from '../api/automation-service';

type DirectiveStatus = 'PENDING' | 'EXECUTED';

type DirectiveAction = { type: string; reason: string };

type DirectiveMetadata = {
  title?: string;
  actions?: DirectiveAction[];
  outcome?: string;
  status?: DirectiveStatus;
};

type Directive = {
  id: string;
  reason: string;
  metadata: DirectiveMetadata;
};

export function ExecutiveDirective({ workspaceId }: { workspaceId: string }) {
  const [directive, setDirective] = useState<Directive | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    getExecutiveDirective(workspaceId)
      .then((data) => setDirective(data as unknown as Directive))
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  const isExecuted = directive?.metadata.status === 'EXECUTED';

  const actions = useMemo(() => {
    const list = directive?.metadata.actions ?? [];
    return Array.isArray(list) ? list : [];
  }, [directive]);

  const handleExecute = async () => {
    if (!directive) return;
    setIsExecuting(true);
    try {
      await executeExecutiveDirective(directive.id);
      setDirective((prev) =>
        prev
          ? {
              ...prev,
              metadata: { ...prev.metadata, status: 'EXECUTED' satisfies DirectiveStatus },
            }
          : null,
      );
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) return <DirectiveSkeleton />;
  if (!directive) return null;

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-md border border-brand-500/20 bg-brand-50 text-brand-700 flex items-center justify-center">
          <ShieldAlert size={18} />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[color:var(--color-ink)]">Chỉ thị AI</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
            Tóm tắt các hành động đề xuất ở cấp workspace. Xem lại trước khi thực thi.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-surface-border bg-surface-card p-6 space-y-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-[color:var(--color-ink)] tracking-tight">
              {directive.metadata.title || 'Chỉ thị mới'}
            </h3>
            <span
              className={[
                'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold',
                isExecuted
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700',
              ].join(' ')}
            >
              {isExecuted ? 'Đã thực thi' : 'Chờ thực thi'}
            </span>
          </div>
          <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
            {directive.reason}
          </p>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-[color:var(--color-ink)]">
            Danh sách hành động
          </div>
          {actions.length ? (
            <ol className="space-y-2">
              {actions.map((action, idx) => (
                <li
                  key={`${action.type}-${idx}`}
                  className="rounded-lg border border-surface-border bg-black/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[color:var(--color-muted)]">
                        Hành động {idx + 1}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[color:var(--color-ink)] break-words">
                        {String(action.type || 'ACTION').replaceAll('_', ' ')}
                      </div>
                    </div>
                    {isExecuted ? <CheckCircle2 size={18} className="text-emerald-600" /> : null}
                  </div>
                  {action.reason ? (
                    <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
                      {action.reason}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-surface-border bg-black/[0.02] p-6 text-sm text-[color:var(--color-muted)]">
              Không có hành động nào trong chỉ thị này.
            </div>
          )}
        </div>

        {directive.metadata.outcome ? (
          <div className="rounded-lg border border-surface-border bg-brand-50 p-4">
            <div className="text-xs font-medium text-brand-700">Kết quả dự kiến</div>
            <div className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
              {directive.metadata.outcome}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-4">
          {!isExecuted ? (
            <button
              type="button"
              onClick={handleExecute}
              disabled={isExecuting}
              className="btn btn-primary"
            >
              {isExecuting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Fingerprint size={16} />
              )}
              {isExecuting ? 'Đang thực thi…' : 'Thực thi chỉ thị'}
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Chỉ thị đã được thực thi
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function DirectiveSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-64 rounded-md bg-black/[0.03] border border-surface-border" />
      <div className="h-[420px] rounded-xl bg-black/[0.03] border border-surface-border" />
    </div>
  );
}

import React from 'react';
import { Activity, Cpu, Power, Sparkles, Trash, Zap } from 'lucide-react';
import {
  useAutomationRules,
  useDeleteAutomationRule,
  useToggleAutomationRule,
} from '../hooks/use-automation-rules';

interface AutomationListProps {
  workspaceId: string;
  projectId?: string;
}

export function AutomationList({ workspaceId, projectId }: AutomationListProps) {
  const { data: rules, isLoading } = useAutomationRules(workspaceId, projectId);
  const toggleMutation = useToggleAutomationRule(workspaceId, projectId);
  const deleteMutation = useDeleteAutomationRule(workspaceId, projectId);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface-bg">
          <Activity className="h-5 w-5 text-brand-600" />
        </div>
        <div className="text-sm text-[color:var(--color-muted)]">Đang tải rule…</div>
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-surface-border bg-surface-bg p-12 text-center">
        <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-md border border-surface-border bg-surface-card text-brand-600">
          <Sparkles size={18} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-[color:var(--color-ink)]">
          Chưa có automation
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
          Tạo rule để tự động hóa workflow cho dự án.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rules.map((rule) => {
        const actions = rule.actions as unknown as Array<{ type: string }>;
        const primaryAction = actions[0]?.type || 'EXECUTE';

        return (
          <div
            key={rule.id}
            className={`rounded-xl border p-5 shadow-sm transition-colors ${
              rule.isActive
                ? 'border-brand-200 bg-brand-50'
                : 'border-surface-border bg-surface-card'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                    {rule.name}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      rule.isActive
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-surface-border bg-black/[0.02] text-[color:var(--color-muted)]'
                    }`}
                  >
                    {rule.isActive ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>
                {rule.description ? (
                  <p className="mt-1 text-sm text-[color:var(--color-muted)] line-clamp-2 leading-relaxed">
                    {rule.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[color:var(--color-muted)]">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-brand-600">
                      <Zap size={14} />
                    </span>
                    Trigger:{' '}
                    <span className="font-medium text-[color:var(--color-ink)]">
                      {rule.trigger.type}
                    </span>
                  </span>
                  <span className="h-4 w-px bg-surface-border" aria-hidden />
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-indigo-700">
                      <Cpu size={14} />
                    </span>
                    Action:{' '}
                    <span className="font-medium text-[color:var(--color-ink)]">
                      {primaryAction}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleMutation.mutate(rule)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors ${
                    rule.isActive
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)]'
                  }`}
                  title={rule.isActive ? 'Tắt rule' : 'Bật rule'}
                  aria-label={rule.isActive ? 'Deactivate rule' : 'Activate rule'}
                >
                  <Power size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(rule.id)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors"
                  title="Xóa rule"
                  aria-label="Delete rule"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Play, Plus, RefreshCw, Settings2, Trash2, Zap } from 'lucide-react';
import type { WorkflowRuleDTO } from '@superboard/shared';
import { AppOverlay } from '@/components/ui/app-overlay';
import {
  createAutomationRule,
  deleteAutomationRule,
  generateAutomationRule,
  getAutomationRules,
  updateAutomationRule,
} from '../api/automation-service';

interface AutomationSlideOverProps {
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export function AutomationSlideOver({ workspaceId, projectId, onClose }: AutomationSlideOverProps) {
  const [rules, setRules] = useState<WorkflowRuleDTO[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    try {
      setIsLoading(true);
      setRules(await getAutomationRules(workspaceId, projectId));
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, projectId]);

  useEffect(() => {
    Promise.resolve().then(() => fetchRules());
  }, [fetchRules]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const generated = await generateAutomationRule(prompt);
      await createAutomationRule({
        ...(generated as Record<string, unknown>),
        workspaceId,
        projectId,
      });
      setPrompt('');
      await fetchRules();
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRule = async (ruleId: string, current: boolean) => {
    try {
      await updateAutomationRule(ruleId, { isActive: !current });
      await fetchRules();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      await deleteAutomationRule(ruleId);
      await fetchRules();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <AppOverlay
      isOpen
      onClose={onClose}
      title="Tự động hoá"
      subtitle="Quy tắc chạy trong workspace (tối giản hiệu ứng theo DESIGN.md)."
      variant="slide-over"
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-[color:var(--color-muted)]">
            Engine: active · Workspace scope
          </span>
          <button type="button" className="btn btn-secondary" onClick={fetchRules}>
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>
      }
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
            <Zap size={16} className="text-brand-600" />
            Tạo quy tắc mới
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Thông báo khi task Done mà thiếu tóm tắt."
            className="form-textarea h-28"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
              {isGenerating ? 'Đang tạo…' : 'Tạo'}
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Quy tắc</div>
            <div className="text-xs text-[color:var(--color-muted)] tabular-nums">
              {rules.length} rules
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 rounded-xl bg-black/[0.03] border border-surface-border"
                />
              ))}
            </div>
          ) : rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    rule.isActive
                      ? 'bg-surface-card border-surface-border hover:bg-black/[0.02]'
                      : 'bg-black/[0.02] border-surface-border opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            rule.isActive ? 'bg-emerald-600' : 'bg-[color:var(--color-faint)]'
                          }`}
                          aria-hidden
                        />
                        <h4 className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
                          {rule.name}
                        </h4>
                      </div>
                      <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
                        {rule.description || 'Quy tắc tự động hoá.'}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
                        <span className="inline-flex items-center rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5">
                          Trigger:{' '}
                          <span className="ml-1 font-medium text-[color:var(--color-ink)]">
                            {rule.trigger.type}
                          </span>
                        </span>
                        <ArrowRight size={12} className="text-[color:var(--color-faint)]" />
                        <span className="inline-flex items-center rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5">
                          Action:{' '}
                          <span className="ml-1 font-medium text-[color:var(--color-ink)]">
                            {rule.actions[0]?.type ?? '—'}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleRule(rule.id, rule.isActive)}
                        className="btn btn-secondary px-3"
                        title="Bật/tắt"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRule(rule.id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
                        title="Xoá"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-surface-border bg-black/[0.02] p-8 text-center">
              <Plus size={28} className="mx-auto text-[color:var(--color-faint)]" />
              <p className="mt-3 text-sm text-[color:var(--color-muted)]">Chưa có quy tắc nào.</p>
            </div>
          )}
        </section>
      </div>
    </AppOverlay>
  );
}

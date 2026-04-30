import React, { useMemo, useState } from 'react';
import type { WorkflowRuleDTO } from '@superboard/shared';
import { AlertCircle, Check, Code, Sparkles, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AppOverlay } from '@/components/ui/app-overlay';
import { useAppMutation } from '@/lib/hooks/use-app-mutation';
import { generateAutomationRule } from '../api/automation-service';
import { useCreateAutomationRule } from '../hooks/use-automation-rules';

interface AIAutomationDialogProps {
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export function AIAutomationDialog({ workspaceId, projectId, onClose }: AIAutomationDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedRule, setGeneratedRule] = useState<Partial<WorkflowRuleDTO> | null>(null);

  const generateMutation = useAppMutation({
    mutationFn: generateAutomationRule,
    successMessage: 'Đã tạo bản nháp rule',
    onSuccess: (data) => {
      if (!data) return toast.error('Tạo rule thất bại');
      setGeneratedRule(data);
    },
  });

  const saveMutation = useCreateAutomationRule(workspaceId, projectId);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generateMutation.mutate(prompt);
  };

  const handleSave = () => {
    if (!generatedRule) return;
    if (!generatedRule.name || !generatedRule.trigger || !generatedRule.actions?.length) {
      toast.error('Bản nháp chưa đủ dữ liệu (name/trigger/actions)');
      return;
    }

    saveMutation.mutate(
      {
        ...generatedRule,
        workspaceId,
        projectId,
      },
      { onSuccess: onClose },
    );
  };

  const preview = useMemo(() => {
    if (!generatedRule) return null;

    const triggerType = generatedRule.trigger?.type ?? '—';
    const actions = generatedRule.actions ?? [];

    return {
      name: generatedRule.name ?? 'Rule mới',
      triggerType,
      actions: actions.map((a) => a?.type ?? 'ACTION'),
      json: JSON.stringify(
        {
          name: generatedRule.name,
          trigger: generatedRule.trigger,
          actions: generatedRule.actions,
        },
        null,
        2,
      ),
    };
  }, [generatedRule]);

  return (
    <AppOverlay
      isOpen
      onClose={onClose}
      title="Tạo rule tự động (AI)"
      subtitle="Mô tả quy tắc bằng ngôn ngữ tự nhiên. SuperBoard sẽ tạo bản nháp để bạn xem lại trước khi lưu."
      variant="modal"
      maxWidth="4xl"
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-[color:var(--color-muted)]">
            <AlertCircle size={14} className="mt-0.5" />
            <p className="leading-relaxed">
              Kiểm tra kỹ trigger/actions trước khi lưu. Bạn luôn có thể chỉnh sửa rule sau khi tạo.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!generatedRule || saveMutation.isPending}
            >
              <Check size={16} />
              {saveMutation.isPending ? 'Đang lưu…' : 'Lưu rule'}
            </button>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-ink)]">
            <Sparkles size={16} className="text-brand-600" />
            Mô tả quy tắc
          </div>
          <form onSubmit={handleGenerate} className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ví dụ: Khi task chuyển sang DONE thì gửi thông báo cho người tạo task."
              className="form-textarea h-40"
            />
            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!prompt.trim() || generateMutation.isPending}
              >
                <Zap size={16} />
                {generateMutation.isPending ? 'Đang tạo…' : 'Tạo bản nháp'}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4 text-sm text-[color:var(--color-muted)] leading-relaxed">
            Gợi ý: mô tả rõ{' '}
            <span className="font-medium text-[color:var(--color-ink)]">khi nào</span> (trigger) và{' '}
            <span className="font-medium text-[color:var(--color-ink)]">làm gì</span> (actions).
          </div>
        </section>

        <section className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">Bản nháp</div>
            {preview ? (
              <span className="inline-flex items-center rounded-full border border-brand-500/20 bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {preview.triggerType}
              </span>
            ) : null}
          </div>

          {preview ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-surface-border bg-surface-card p-5">
                <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {preview.name}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4">
                    <div className="text-xs font-medium text-[color:var(--color-muted)]">
                      Trigger
                    </div>
                    <div className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                      {preview.triggerType}
                    </div>
                  </div>
                  <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4">
                    <div className="text-xs font-medium text-[color:var(--color-muted)]">
                      Actions
                    </div>
                    <ul className="mt-1 space-y-1 text-sm text-[color:var(--color-ink)]">
                      {preview.actions.length ? (
                        preview.actions.map((a, idx) => (
                          <li key={`${a}-${idx}`} className="flex items-start gap-2">
                            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-surface-border bg-surface-card text-xs text-[color:var(--color-muted)]">
                              {idx + 1}
                            </span>
                            <span className="min-w-0 break-words">{a}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-[color:var(--color-muted)]">—</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-surface-border bg-black/[0.02] p-4 overflow-auto max-h-[50vh]">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-[color:var(--color-muted)]">
                  <Code size={14} />
                  JSON preview
                </div>
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[color:var(--color-ink)]">
                  {preview.json}
                </pre>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-surface-border bg-black/[0.02] p-10 text-center text-sm text-[color:var(--color-muted)]">
              Chưa có bản nháp. Nhập mô tả và bấm “Tạo bản nháp”.
            </div>
          )}
        </section>
      </div>
    </AppOverlay>
  );
}

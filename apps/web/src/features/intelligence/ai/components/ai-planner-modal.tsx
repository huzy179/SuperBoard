'use client';

import { useMemo, useState } from 'react';
import { Check, Layers, Loader2, Plus, Target, X } from 'lucide-react';
import { toast } from 'sonner';
import { generateProjectPlan, type AiSuggestedTask } from '../api/ai-service';
import { createProjectTask } from '@/features/operations/task/api/task-service';

interface AiPlannerModalProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onPlanExecuted: () => void;
}

export function AiPlannerModal({
  projectId,
  isOpen,
  onClose,
  onPlanExecuted,
}: AiPlannerModalProps) {
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [proposedPlan, setProposedPlan] = useState<AiSuggestedTask[] | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const selectedCount = selectedTasks.size;
  const totalPoints = useMemo(() => {
    if (!proposedPlan) return 0;
    return proposedPlan
      .filter((_, i) => selectedTasks.has(i))
      .reduce((acc, t) => acc + (t.storyPoints || 0), 0);
  }, [proposedPlan, selectedTasks]);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    try {
      const data = await generateProjectPlan(projectId, goal);
      setProposedPlan(data.suggestedTasks);
      setSelectedTasks(new Set(data.suggestedTasks.map((_: unknown, i: number) => i)));
    } catch {
      toast.error('Không thể tạo kế hoạch AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!proposedPlan) return;
    setIsLoading(true);
    try {
      const tasksToCreate = proposedPlan.filter((_, i) => selectedTasks.has(i));
      if (tasksToCreate.length === 0) return;

      await Promise.all(
        tasksToCreate.map((task) =>
          createProjectTask(projectId, {
            title: task.title || 'New Task',
            description: `AI Planned: ${goal}`,
            priority: task.priority || 'medium',
            storyPoints: task.storyPoints || 1,
          }),
        ),
      );

      toast.success('Kế hoạch đã được khởi tạo thành công');
      onPlanExecuted();
      onClose();
    } catch {
      toast.error('Lỗi khi thực thi kế hoạch');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="AI planner">
      <div className="modal-panel max-w-3xl h-[80vh] flex flex-col">
        <div className="modal-header">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-md border border-surface-border bg-brand-50 text-brand-700">
              <Target size={18} />
            </div>
            <div>
              <div className="modal-title">AI Planner</div>
              <div className="modal-subtitle">Tạo kế hoạch dự án từ mục tiêu cấp cao.</div>
            </div>
          </div>

          <button type="button" onClick={onClose} className="modal-close-btn" aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body flex-1 overflow-y-auto">
          {!proposedPlan ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                  Bạn muốn đạt được điều gì?
                </div>
                <div className="text-sm text-[color:var(--color-muted)] leading-relaxed">
                  Nhập mục tiêu, AI sẽ gợi ý danh sách task. Bạn có thể chọn/bỏ chọn trước khi tạo.
                </div>
              </div>

              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ví dụ: Triển khai thanh toán Stripe với subscription, webhook và trang quản trị…"
                className="form-textarea h-32"
              />

              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Huỷ
                </button>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!goal.trim() || isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      Đang tạo…
                    </span>
                  ) : (
                    'Tạo kế hoạch'
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                    Kế hoạch đề xuất
                  </div>
                  <div className="text-sm text-[color:var(--color-muted)]">
                    Chọn task bạn muốn khởi tạo.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setProposedPlan(null);
                    setSelectedTasks(new Set());
                  }}
                  className="text-sm font-medium text-brand-700 hover:underline self-start sm:self-auto"
                >
                  Nhập lại mục tiêu
                </button>
              </div>

              <div className="grid gap-3">
                {proposedPlan.map((task, idx) => {
                  const isSelected = selectedTasks.has(idx);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedTasks);
                        if (next.has(idx)) next.delete(idx);
                        else next.add(idx);
                        setSelectedTasks(next);
                      }}
                      className={`w-full text-left rounded-lg border p-4 transition-colors ${
                        isSelected
                          ? 'border-brand-200 bg-brand-50'
                          : 'border-surface-border bg-surface-card hover:bg-black/[0.02]'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md border ${
                            isSelected
                              ? 'border-brand-200 bg-white text-brand-700'
                              : 'border-surface-border bg-surface-bg text-[color:var(--color-muted)]'
                          }`}
                          aria-hidden
                        >
                          {isSelected ? <Check size={18} /> : <Plus size={18} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-[color:var(--color-muted)]">
                              Task {idx + 1}
                            </span>
                            <span className="rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-muted)]">
                              {task.priority || 'medium'}
                            </span>
                            <span className="rounded-full border border-surface-border bg-black/[0.02] px-2 py-0.5 text-[11px] font-medium text-[color:var(--color-muted)]">
                              {task.storyPoints || 1} pts
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                            {task.title || 'New Task'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {proposedPlan ? (
          <div className="modal-footer px-[var(--space-6)] pb-[var(--space-6)] pt-[var(--space-4)]">
            <div className="flex flex-1 items-center gap-3 text-sm text-[color:var(--color-muted)]">
              <span>
                Đã chọn{' '}
                <span className="font-semibold text-[color:var(--color-ink)]">{selectedCount}</span>
              </span>
              <span className="h-4 w-px bg-surface-border" aria-hidden />
              <span>
                Tổng điểm{' '}
                <span className="font-semibold text-[color:var(--color-ink)]">{totalPoints}</span>
              </span>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Đóng
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={selectedTasks.size === 0 || isLoading}
                className="btn btn-primary"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Layers size={16} />
                    Tạo các task đã chọn
                  </span>
                )}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

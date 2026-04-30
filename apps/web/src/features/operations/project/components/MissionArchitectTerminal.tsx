import { useState, useRef } from 'react';
import { Terminal, Sparkles, Loader2, CheckCircle2, Upload, X, Target } from 'lucide-react';
import { useProjectDetailContext } from '../context/ProjectDetailContext';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { AppOverlay } from '@/components/ui/app-overlay';

export function MissionArchitectTerminal() {
  const queryClient = useQueryClient();
  const { projectId } = useProjectDetailContext();
  const [goal, setGoal] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  // Vision states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageEncoded, setImageEncoded] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plan, setPlan] = useState<any>(null);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setImageEncoded(base64String.split(',')[1] ?? null);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageEncoded(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async () => {
    if (!goal.trim() && !imageEncoded) return;
    setIsAnalyzing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { result } = await apiPost<any>(
        `/v1/projects/${projectId}/plan`,
        {
          goal,
          image: imageEncoded,
        },
        { auth: true },
      );
      setPlan(result);
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Phân tích kiến trúc thất bại');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeploy = async () => {
    const tasksToDeploy = plan?.tasks ?? [];
    const statusesToDeploy = plan?.suggested_statuses ?? [];

    if (!tasksToDeploy || tasksToDeploy.length === 0) return;

    setIsDeploying(true);
    toast.promise(
      async () => {
        // 1. Sync Statuses first
        if (statusesToDeploy && statusesToDeploy.length > 0) {
          await apiPost(
            `/v1/projects/${projectId}/statuses/sync`,
            {
              statuses: statusesToDeploy,
            },
            { auth: true },
          );
        }

        // 2. Batch create tasks
        await apiPost(
          `/v1/projects/${projectId}/tasks/batch`,
          {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tasks: tasksToDeploy.map((t: any) => ({
              title: t.title,
              description: t.description,
              priority: t.priority,
              type: t.type,
              status: t.status,
            })),
          },
          { auth: true },
        );

        // 3. Optional: Generate Briefing in background
        void apiPost(
          `/v1/jira/projects/${projectId}/generate-briefing`,
          {
            goal: plan ? plan.goal : goal,
            tasks: tasksToDeploy,
          },
          { auth: true },
        ).catch(console.error);

        // Invalidate queries to refresh the board/list
        await queryClient.invalidateQueries({ queryKey: ['projects', projectId] });

        setIsOpen(false);
        setGoal('');
        setPlan(null);
        clearImage();
      },
      {
        loading: 'Đang triển khai kiến trúc nhiệm vụ...',
        success: 'Hoàn tất! Các thực thể đã được đồng bộ vào Jira Board.',
        error: 'Triển khai thất bại.',
      },
    );
    setIsDeploying(false);
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-md border border-surface-border bg-surface-card text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors"
      >
        <Terminal size={18} className="text-brand-500" />
        <span className="text-sm font-semibold">Mission Architect</span>
      </button>

      <AppOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Mission Architect"
        subtitle="Phân rã mục tiêu thành danh sách nhiệm vụ"
        variant="modal"
        maxWidth="3xl"
        footer={
          plan ? (
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setPlan(null)} className="btn btn-secondary">
                Quay lại
              </button>
              <button
                type="button"
                onClick={handleDeploy}
                disabled={isDeploying || !plan?.tasks?.length}
                className="btn btn-primary"
              >
                {isDeploying ? (
                  <>
                    <Loader2 size={16} className="btn-spinner" /> Đang triển khai…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} /> Triển khai
                  </>
                )}
              </button>
            </div>
          ) : undefined
        }
      >
        {!plan ? (
          <div className="space-y-6">
            <div>
              <label className="form-label">Mục tiêu</label>
              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Ví dụ: Xây dựng hệ thống thanh toán tự động"
                className="form-textarea h-32"
              />
            </div>

            <div>
              <label className="form-label">Tùy chọn</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-surface-border bg-black/[0.02]">
                    <img src={imagePreview} className="h-full w-full object-cover" alt="Preview" />
                    <button
                      type="button"
                      onClick={clearImage}
                      className="absolute top-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] transition-colors"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 w-20 border border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-brand-500/40 transition-colors bg-surface-card"
                  >
                    <Upload size={16} className="text-[color:var(--color-muted)]" />
                    <span className="text-[10px] font-semibold text-[color:var(--color-muted)]">
                      Upload
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!goal.trim() && !imageEncoded)}
                  className="flex-1 h-20 rounded-lg border border-surface-border bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Sparkles size={18} />
                  )}
                  Phân tích
                </button>
              </div>
            </div>

            <p className="text-sm text-[color:var(--color-muted)] leading-relaxed">
              Mục tiêu rõ ràng giúp AI đề xuất danh sách nhiệm vụ nhất quán với workflow của dự án.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
              <Target size={14} className="text-brand-600" />
              Đề xuất đã sẵn sàng
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4">
                <p className="text-xs font-medium text-[color:var(--color-muted)]">Statuses</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {plan.suggested_statuses?.map((s: any, i: number) => (
                    <span
                      key={i}
                      className="inline-flex items-center rounded-full border border-surface-border bg-surface-card px-2 py-0.5 text-xs text-[color:var(--color-muted)]"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-surface-border bg-black/[0.02] p-4">
                <p className="text-xs font-medium text-[color:var(--color-muted)]">Tasks</p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--color-ink)]">
                  {plan.tasks?.length || 0}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-surface-border bg-surface-card shadow-glass p-4">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                Danh sách đề xuất
              </p>
              <div className="mt-3 space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {(plan.tasks ?? []).slice(0, 8).map((t: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-md border border-surface-border bg-black/[0.02] px-3 py-2"
                  >
                    <div className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-surface-card text-xs font-semibold text-[color:var(--color-muted)]">
                      {index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[color:var(--color-ink)] truncate">
                        {t.title}
                      </p>
                      {t.description ? (
                        <p className="mt-0.5 text-xs text-[color:var(--color-muted)] line-clamp-2">
                          {t.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
                {plan.tasks?.length > 8 ? (
                  <p className="text-xs text-[color:var(--color-muted)]">
                    +{plan.tasks.length - 8} nhiệm vụ nữa…
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </AppOverlay>
    </div>
  );
}

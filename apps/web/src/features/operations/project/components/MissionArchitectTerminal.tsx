import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  Sparkles,
  Loader2,
  CheckCircle2,
  Upload,
  X,
  Activity,
  Target,
} from 'lucide-react';
import { useProjectDetailContext } from '../context/ProjectDetailContext';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';

export function MissionArchitectTerminal() {
  const queryClient = useQueryClient();
  const { projectId } = useProjectDetailContext();
  const [goal, setGoal] = useState('');
  const [isSynthesizing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [suggestedStatuses, setSuggestedStatuses] = useState<any[]>([]);
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
    const tasksToDeploy = plan ? plan.tasks : suggestedTasks;
    const statusesToDeploy = plan ? plan.suggested_statuses : suggestedStatuses;

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
        setSuggestedTasks([]);
        setSuggestedStatuses([]);
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

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-surface-card border border-surface-border rounded-lg shadow-glass p-6 z-[101] overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-50 border border-brand-500/15 rounded-lg text-brand-500">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--color-ink)]">
                      Mission Architect
                    </h2>
                    <p className="text-sm text-[color:var(--color-muted)]">
                      Phân rã mục tiêu thành danh sách nhiệm vụ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] hover:bg-black/[0.04] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {!plan ? (
                <div className="space-y-6">
                  <div className="relative">
                    <textarea
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Nhập mục tiêu chiến lược của bạn... (ví dụ: Xây dựng hệ thống thanh toán tự động)"
                      className="form-textarea h-32"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {imagePreview ? (
                      <div className="relative h-20 w-20 rounded-xl overflow-hidden border border-brand-500/30">
                        <img
                          src={imagePreview}
                          className="h-full w-full object-cover"
                          alt="Preview"
                        />
                        <button
                          onClick={clearImage}
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 text-white"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 w-20 border-2 border-dashed border-surface-border rounded-lg flex flex-col items-center justify-center gap-1 hover:border-brand-500/40 transition-colors"
                      >
                        <Upload size={16} className="text-[color:var(--color-muted)]" />
                        <span className="text-[10px] font-semibold text-[color:var(--color-muted)]">
                          Upload
                        </span>
                      </button>
                    )}
                    <button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || (!goal.trim() && !imageEncoded)}
                      className="flex-1 h-20 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center justify-center"
                    >
                      {isAnalyzing ? <Activity className="animate-spin" /> : 'Phân tích kiến trúc'}
                    </button>
                  </div>

                  <AnimatePresence>
                    {isSynthesizing && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center py-6 gap-4"
                      >
                        <Loader2 size={32} className="text-brand-500 animate-spin" />
                        <p className="text-[10px] font-black text-brand-400 uppercase tracking-[0.5em] animate-pulse">
                          Đang bóc tách dữ liệu nhiệm vụ...
                        </p>
                      </motion.div>
                    )}

                    {suggestedTasks.length > 0 && !isSynthesizing && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
                      >
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-px flex-1 bg-white/5" />
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em]">
                            Kiến trúc nhiệm vụ đề xuất
                          </span>
                          <div className="h-px flex-1 bg-white/5" />
                        </div>
                        <div className="grid gap-3">
                          {suggestedTasks.map((t, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-lg hover:bg-white/[0.04] transition-colors group/item"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                  <div className="h-5 w-5 rounded-full border border-brand-500/30 flex items-center justify-center">
                                    <span className="text-[8px] font-black text-brand-400">
                                      {i + 1}
                                    </span>
                                  </div>
                                  <span className="text-xs text-white/80 group-hover/item:text-white transition-colors uppercase font-black">
                                    {t.title}
                                  </span>
                                </div>
                                {t.description && (
                                  <p className="ml-8 text-[10px] text-white/30 line-clamp-1">
                                    {t.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleDeploy}
                          className="w-full py-4 bg-brand-500 text-white rounded-lg font-black uppercase tracking-widest hover:bg-brand-400 transition-all flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 size={18} />
                          Triển khai nhiệm vụ
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit">
                    <Target className="text-indigo-400" size={14} />
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      Synthesis Complete
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg">
                      <h3 className="text-[10px] font-black text-white/30 uppercase mb-2">
                        Statuses
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {plan.suggested_statuses?.map((s: any, i: number) => (
                          <span
                            key={i}
                            className="px-2 py-1 bg-white/10 rounded text-[9px] text-white/60"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg flex flex-col justify-center">
                      <h3 className="text-[10px] font-black text-white/30 uppercase mb-2">Tasks</h3>
                      <span className="text-2xl font-black text-white">
                        {plan.tasks?.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setPlan(null)}
                      className="flex-1 py-4 bg-white/5 border border-white/5 rounded-lg text-xs font-black uppercase text-white hover:bg-white/10 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleDeploy}
                      disabled={isDeploying}
                      className="flex-[2] py-4 bg-brand-500 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 hover:bg-brand-400 transition-all"
                    >
                      {isDeploying ? (
                        <Activity className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} /> Deploy Architecture
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

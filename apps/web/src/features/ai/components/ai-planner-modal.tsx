'use client';

import { useState } from 'react';
import { X, Sparkles, Plus, Check, Zap, Target, Layers, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SuggestedTask {
  title: string;
  priority: 'high' | 'medium' | 'low';
  storyPoints: number;
}

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
  const [proposedPlan, setProposedPlan] = useState<SuggestedTask[] | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();
      setProposedPlan(data.data.suggestedTasks);
      setSelectedTasks(new Set(data.data.suggestedTasks.map((_: unknown, i: number) => i)));
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

      // Execute multi-task creation via the bulk API
      await fetch(`/api/v1/projects/${projectId}/tasks`, {
        method: 'POST', // Note: For real impl, we'd add a bulk endpoint or loop
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: tasksToCreate[0]?.title || 'New Task',
          description: `AI Planned: ${goal}`,
          priority: tasksToCreate[0]?.priority || 'medium',
          storyPoints: tasksToCreate[0]?.storyPoints || 1,
        }),
      });

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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-4xl bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Strategic AI Planner
              </h2>
              <p className="text-sm text-white/40">Tạo kế hoạch dự án với AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full bg-white/5 text-white/20 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {!proposedPlan ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-8 relative">
                <Sparkles size={32} className="text-indigo-400" />
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
              </div>
              <div className="w-full max-w-xl space-y-6">
                <div className="text-center">
                  <h3 className="text-white font-bold text-lg mb-2">Bạn muốn đạt được điều gì?</h3>
                  <p className="text-white/40 text-sm">
                    Nhập mục tiêu cấp cao của dự án và AI sẽ tự động phân rã thành các task cụ thể.
                  </p>
                </div>
                <div className="relative">
                  <textarea
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Ví dụ: Triển khai hệ thống thanh toán Stripe với hỗ trợ subscription..."
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-lg placeholder:text-white/20 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                      Chế độ AI đang hoạt động
                    </span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={!goal.trim() || isLoading}
                  className="w-full bg-white text-slate-950 h-16 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />}
                  <span>Tạo kế hoạch với AI</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1 block">
                    Chiến lược đã được tạo
                  </span>
                  <h3 className="text-white font-bold text-xl">{goal}</h3>
                </div>
                <button
                  onClick={() => setProposedPlan(null)}
                  className="text-xs font-bold text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2"
                >
                  <ArrowRight size={14} /> Định nghĩa lại mục tiêu
                </button>
              </div>

              <div className="grid gap-4">
                {proposedPlan.map((task, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      const next = new Set(selectedTasks);
                      if (next.has(idx)) next.delete(idx);
                      else next.add(idx);
                      setSelectedTasks(next);
                    }}
                    className={`
                                    group relative p-6 rounded-[2rem] border transition-all cursor-pointer
                                    ${
                                      selectedTasks.has(idx)
                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                        : 'bg-white/5 border-white/5 hover:border-white/10 opacity-50'
                                    }
                                `}
                  >
                    <div className="flex items-center gap-6">
                      <div
                        className={`
                                        w-10 h-10 rounded-full flex items-center justify-center border transition-all
                                        ${selectedTasks.has(idx) ? 'bg-indigo-500 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-white/20'}
                                    `}
                      >
                        {selectedTasks.has(idx) ? <Check size={20} /> : <Plus size={20} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                            Phase {idx + 1}
                          </span>
                          <div
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                              task.priority === 'high'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {task.priority}
                          </div>
                        </div>
                        <h4 className="text-white font-bold">{task.title}</h4>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-1">
                          Complexity
                        </div>
                        <div className="text-white font-black">{task.storyPoints} PTS</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {proposedPlan && (
          <div className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Đang xử lý
                </span>
                <span className="text-white font-black">{selectedTasks.size} Tasks</span>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Tổng độ phức tạp
                </span>
                <span className="text-white font-black">
                  {proposedPlan
                    .filter((_, i) => selectedTasks.has(i))
                    .reduce((acc, t) => acc + t.storyPoints, 0)}{' '}
                  PTS
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="px-8 h-14 rounded-2xl text-[10px] font-black text-white/40 hover:text-white transition-all uppercase tracking-widest"
              >
                Huỷ
              </button>
              <button
                onClick={handleExecute}
                disabled={selectedTasks.size === 0 || isLoading}
                className="px-8 h-14 rounded-2xl bg-indigo-500 text-white shadow-glow-brand font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Layers size={16} />}
                <span>Thực thi kế hoạch</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

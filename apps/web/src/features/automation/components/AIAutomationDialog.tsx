import React, { useState } from 'react';
import {
  X,
  Sparkles,
  AlertCircle,
  Terminal,
  Cpu,
  Zap,
  Activity,
  ShieldCheck,
  Box,
  Check,
} from 'lucide-react';
import { apiPost } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AIAutomationDialogProps {
  workspaceId: string;
  projectId?: string;
  onClose: () => void;
}

export function AIAutomationDialog({ workspaceId, projectId, onClose }: AIAutomationDialogProps) {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState('');
  const [generatedRule, setGeneratedRule] = useState<{
    name: string;
    trigger: { type: string; config: Record<string, unknown> };
    actions: Array<{ type: string; config: Record<string, unknown> }>;
  } | null>(null);

  const generateMutation = useMutation({
    mutationFn: (text: string) =>
      apiPost('/automation/generate-rule', { prompt: text }, { auth: true }),
    onSuccess: (data) => {
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setGeneratedRule(data as any);
        toast.success('Tổng hợp logic hoàn tất');
      } else {
        toast.error('Xử lý thất bại');
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/automation/rules?workspaceId=${workspaceId}`, data, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Giao thức đã kích hoạt');
      onClose();
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    generateMutation.mutate(prompt);
  };

  const handleSave = () => {
    if (!generatedRule) return;
    saveMutation.mutate({
      ...generatedRule,
      projectId,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-700">
      {/* Dynamic Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/[0.03] blur-[150px] rounded-full animate-pulse" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
      </div>

      <div className="bg-slate-950/80 w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-white/5 backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] relative z-10 transition-all">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />

        {/* Header */}
        <div className="px-10 py-8 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-5">
            <div className="p-3.5 bg-brand-500/10 rounded-2xl border border-brand-500/20 shadow-glow-brand/5 group">
              <Sparkles
                size={24}
                className="text-brand-400 group-hover:scale-110 transition-transform"
              />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-widest text-white">
                Tổng hợp logic AI
              </h3>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-glow-emerald" />
                <p className="text-white/20 text-[9px] font-black uppercase tracking-[0.3em]">
                  Module tổng hợp đang hoạt động // v2.4.0
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/5 rounded-2xl transition-all text-white/20 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 py-10 space-y-12 scrollbar-none">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-3">
                <Terminal size={14} className="text-brand-500" />
                <span>Luồng định nghĩa giao thức</span>
              </label>
              <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-brand-500 w-1/3 animate-progress" />
                </div>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-500/10 to-transparent rounded-[2.2rem] opacity-0 group-focus-within:opacity-100 transition-opacity blur-lg" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="MÔ TẢ QUY TẮC BẠN MUỐN..."
                className="relative w-full px-8 py-8 bg-white/[0.02] border border-white/5 rounded-[2rem] focus:bg-white/[0.04] focus:border-brand-500/30 outline-none transition-all font-black text-lg text-white min-h-[160px] resize-none placeholder:text-white/5 tracking-tight"
              />

              <div className="absolute bottom-6 right-6 flex items-center gap-4">
                <button
                  type="submit"
                  disabled={generateMutation.isPending || !prompt.trim()}
                  className={`px-8 py-4 rounded-xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest transition-all ${
                    prompt.trim()
                      ? 'bg-brand-500 text-white shadow-glow-brand/20 hover:bg-brand-400'
                      : 'bg-white/5 text-white/10'
                  }`}
                >
                  {generateMutation.isPending ? (
                    <Activity size={16} className="animate-pulse" />
                  ) : (
                    <Zap size={16} className={prompt.trim() ? 'animate-pulse' : ''} />
                  )}
                  <span>{generateMutation.isPending ? 'Đang xử lý...' : 'Chạy phân tích'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Logic Flow Visualization */}
          {generatedRule && (
            <div className="space-y-10 animate-in slide-in-from-bottom-8 duration-1000">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">
                  Luồng xử lý
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
              </div>

              <div className="relative">
                {/* Connection Line Proxy */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-brand-500/20 via-indigo-500/20 to-brand-500/20 -translate-y-1/2" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  {/* Trigger Node */}
                  <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-brand-500/20 shadow-glow-brand/5 group/node hover:bg-slate-900/60 transition-all">
                    <div className="flex flex-col items-center text-center gap-5">
                      <div className="p-4 bg-brand-500/10 rounded-2xl border border-brand-500/30 text-brand-400 group-hover/node:scale-110 transition-transform">
                        <Cpu size={24} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-brand-500/60 uppercase tracking-widest">
                          Khởi tạo
                        </span>
                        <p className="text-sm font-black text-white uppercase tracking-wider">
                          {generatedRule.trigger.type}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-[9px] font-black text-brand-400 uppercase tracking-widest">
                        Đã kích hoạt
                      </div>
                    </div>
                  </div>

                  {/* Logic Core */}
                  <div className="p-8 rounded-[2.5rem] bg-indigo-500/[0.03] border border-white/5 flex flex-col items-center justify-center gap-4">
                    <div className="flex gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-ping" />
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse [animation-delay:0.2s]" />
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-ping [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[10px] font-black text-white/10 uppercase tracking-[0.3em] font-mono">
                      NEURAL_X_OVER
                    </span>
                  </div>

                  {/* Action Node */}
                  <div className="p-8 rounded-[2.5rem] bg-slate-900/40 border border-indigo-500/20 shadow-glow-indigo/5 group/node hover:bg-slate-900/60 transition-all">
                    <div className="flex flex-col items-center text-center gap-5">
                      <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/30 text-indigo-400 group-hover/node:scale-110 transition-transform">
                        <Box size={24} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-indigo-500/60 uppercase tracking-widest">
                          Thực thi
                        </span>
                        <p className="text-sm font-black text-white uppercase tracking-wider">
                          {generatedRule.actions[0]?.type || 'ACTION'}
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                        Sẵn sàng
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Result Blueprint */}
              <div className="p-8 rounded-[2.5rem] bg-slate-900/60 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/[0.02] blur-3xl rounded-full" />
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-brand-500" />
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                      Thiết kế đã xác minh
                    </span>
                  </div>
                  <span className="text-[12px] font-black text-white tracking-widest bg-brand-500/10 border border-brand-500/20 px-3 py-1 rounded-lg">
                    {generatedRule.name}
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-[9px] font-black text-white/10 uppercase tracking-widest">
                      Định nghĩa kỹ thuật
                    </span>
                    <p className="text-sm text-white/60 leading-relaxed font-medium italic">
                      Triển khai quy tắc tự động '{generatedRule.name}' để giám sát và phản hồi các
                      sự kiện {generatedRule.trigger.type} trong cụm thực thi chính.
                    </p>
                  </div>
                  <div className="bg-black/40 rounded-2xl p-6 border border-white/5 font-mono group-hover:border-brand-500/20 transition-colors">
                    <div className="flex items-center gap-4 mb-4 opacity-20">
                      <div className="h-2 w-2 rounded-full bg-rose-500" />
                      <div className="h-2 w-2 rounded-full bg-amber-500" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                    <pre className="text-[10px] text-brand-400/80 leading-relaxed">
                      {JSON.stringify(
                        {
                          trigger: generatedRule.trigger.type,
                          action_count: generatedRule.actions.length,
                          priority_level: 'TIÊU CHUẨN',
                        },
                        null,
                        2,
                      )}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3 opacity-30">
            <AlertCircle size={16} className="text-amber-500" />
            <p className="text-[9px] font-black text-white uppercase tracking-widest">
              Kiểm tra chuỗi trước khi kích hoạt giao thức
            </p>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="font-black text-white/20 hover:text-white transition-all uppercase text-[10px] tracking-[0.2em]"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleSave}
              disabled={!generatedRule || saveMutation.isPending}
              className={`px-10 py-5 rounded-2xl font-black shadow-2xl transition-all duration-300 active:scale-95 flex items-center gap-3 uppercase text-[11px] tracking-[0.2em] relative overflow-hidden group/btn ${
                generatedRule && !saveMutation.isPending
                  ? 'bg-brand-500 text-white shadow-glow-brand/20 hover:bg-brand-400'
                  : 'bg-white/5 text-white/10'
              }`}
            >
              {saveMutation.isPending ? (
                <Activity size={18} className="animate-spin" />
              ) : (
                <>
                  <Check size={18} className="group-hover/btn:scale-125 transition-transform" />
                  <span>Kích hoạt giao thức</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

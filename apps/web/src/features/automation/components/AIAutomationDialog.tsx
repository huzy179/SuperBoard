import React, { useState } from 'react';
import { X, Sparkles, Send, Check, AlertCircle, Terminal } from 'lucide-react';
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
        setGeneratedRule(data);
        toast.success('AI đã tạo quy tắc cho bạn!');
      } else {
        toast.error('AI không thể tạo quy tắc từ yêu cầu này. Hãy thử lại cụ thể hơn.');
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost(`/automation/rules?workspaceId=${workspaceId}`, data, { auth: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast.success('Đã kích hoạt tự động hóa thành công');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-500">
      {/* Dynamic Background mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
      </div>

      <div className="bg-white/40 w-full max-w-2xl rounded-[3rem] shadow-glass border border-white/20 backdrop-blur-3xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh] relative z-10">
        {/* Rim Light */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

        {/* Header */}
        <div className="p-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20">
              <Sparkles size={28} className="text-brand-400 animate-pulse" />
            </div>
            <div>
              <h3 className="font-black text-2xl uppercase tracking-tighter text-slate-900">
                AI Assistant
              </h3>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                  Workflow Architect Online
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/50 rounded-2xl transition-all hover:scale-110 active:scale-90 text-slate-400 hover:text-slate-900"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-10 space-y-10">
          {/* Input Section */}
          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
              <Terminal size={14} className="text-brand-500" />
              <span>Define your automation goal</span>
            </label>
            <form onSubmit={handleGenerate} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-25 transition duration-500" />
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Khi task chuyển sang High priority, hãy gửi thông báo báo cho tôi..."
                className="relative w-full px-8 py-7 bg-white/60 border border-white/40 rounded-[2.2rem] focus:bg-white focus:border-brand-500/50 outline-none transition-all font-medium min-h-[160px] resize-none text-lg text-slate-800 shadow-inner"
              />
              <button
                type="submit"
                disabled={generateMutation.isPending || !prompt.trim()}
                className="absolute bottom-6 right-6 px-6 py-3 bg-slate-900 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest"
              >
                {generateMutation.isPending ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Generate</span>
                    <Send size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preview Section */}
          {generatedRule && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
              <div className="relative p-[1px] bg-gradient-to-br from-white/80 via-white/20 to-brand-500/30 rounded-[2.5rem] shadow-luxe overflow-hidden group">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl" />
                <div className="relative bg-white/40 rounded-[2.5rem] p-8">
                  <h4 className="flex items-center gap-3 text-slate-900 font-black uppercase text-xs mb-8">
                    <div className="h-8 w-8 rounded-xl bg-brand-500 text-white flex items-center justify-center shadow-lg shadow-brand-500/20">
                      <Check size={18} />
                    </div>
                    Proposed Workflow Blueprint
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Identity
                        </span>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">
                          {generatedRule.name as string}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Trigger Condition
                        </span>
                        <div className="flex items-center gap-3 text-brand-700 font-black text-[11px] uppercase tracking-wider bg-brand-50/50 border border-brand-100 px-4 py-2 rounded-xl w-fit shadow-sm">
                          <Terminal size={14} />
                          {generatedRule.trigger.type}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Active Actions
                        </span>
                        {generatedRule.actions.map((action, i: number) => (
                          <div
                            key={i}
                            className="group/action flex flex-col gap-3 p-5 bg-white/50 rounded-3xl border border-white shadow-sm transition-all hover:bg-white hover:shadow-xl hover:-translate-y-1"
                          >
                            <div className="flex items-center gap-2 text-indigo-700 font-black text-[9px] uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl w-fit">
                              {action.type}
                            </div>
                            <p className="text-[13px] font-bold text-slate-600 leading-relaxed italic">
                              "{(action.config?.message as string) || JSON.stringify(action.config)}
                              "
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/90 backdrop-blur-xl rounded-[2.5rem] p-8 text-slate-300 border border-white/10 shadow-2xl group">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2 px-2">
                    <Terminal size={14} className="text-brand-400" />
                    Neural Execution Payload
                  </span>
                  <div className="flex gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50 border border-rose-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 border border-amber-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 border border-emerald-500/20" />
                  </div>
                </div>
                <pre className="text-[11px] font-mono overflow-x-auto p-6 bg-black/40 rounded-3xl border border-white/5 scrollbar-hide group-hover:border-brand-500/30 transition-colors">
                  {JSON.stringify(generatedRule, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/20 flex items-center justify-between bg-white/20 backdrop-blur-md">
          <div className="flex items-center gap-3 text-slate-500 px-2">
            <AlertCircle size={18} className="text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
              Audit blueprint before activation
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="px-8 py-4 font-black text-slate-400 hover:text-slate-900 transition-all uppercase text-[10px] tracking-widest"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!generatedRule || saveMutation.isPending}
              className="group relative px-10 py-5 bg-slate-900 hover:bg-brand-600 disabled:bg-slate-300 text-white rounded-[1.5rem] font-black shadow-2xl transition-all duration-300 active:scale-95 flex items-center gap-3 uppercase text-[11px] tracking-[0.2em] overflow-hidden"
            >
              {saveMutation.isPending ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} className="group-hover:scale-125 transition-transform" />
                  <span>Activate Rule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

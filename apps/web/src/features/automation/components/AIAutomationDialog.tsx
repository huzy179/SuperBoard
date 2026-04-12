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
  const [generatedRule, setGeneratedRule] = useState<Record<string, unknown> | null>(null);

  const generateMutation = useMutation({
    mutationFn: (text: string) =>
      apiPost('/ai/automation/generate', { prompt: text }, { auth: true }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-black text-xl uppercase tracking-tight">AI Rule Assistant</h3>
              <p className="text-white/70 text-xs font-medium uppercase tracking-widest">
                Natural Language to Workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/80"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Input Section */}
          <div className="space-y-4">
            <label className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={16} />
              <span>Bạn muốn tự động hóa điều gì?</span>
            </label>
            <form onSubmit={handleGenerate} className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ: Khi task chuyển sang High priority, hãy gửi thông báo báo cho tôi..."
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-medium min-h-[140px] resize-none text-lg text-slate-800"
              />
              <button
                type="submit"
                disabled={generateMutation.isPending || !prompt.trim()}
                className="absolute bottom-4 right-4 p-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-2xl shadow-xl shadow-brand-600/30 transition-all active:scale-95 flex items-center gap-2 font-black uppercase text-xs"
              >
                {generateMutation.isPending ? (
                  'Đang phân tích...'
                ) : (
                  <>
                    <span>Generate</span>
                    <Send size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Preview Section */}
          {generatedRule && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="p-1 bg-gradient-to-r from-brand-500 to-indigo-500 rounded-[2rem] shadow-xl">
                <div className="bg-white rounded-[1.9rem] p-6">
                  <h4 className="flex items-center gap-2 text-brand-600 font-black uppercase text-sm mb-6">
                    <Check size={20} className="bg-brand-100 p-1 rounded-full" />
                    Bản thảo quy tắc đề xuất
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Tên quy tắc
                        </span>
                        <p className="text-xl font-bold text-slate-900">{generatedRule.name}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Khi (Trigger)
                        </span>
                        <div className="flex items-center gap-2 text-brand-700 font-bold bg-brand-50 px-3 py-1.5 rounded-lg w-fit">
                          <Terminal size={14} />
                          {generatedRule.trigger.type}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Thì (Action)
                        </span>
                        {((generatedRule as Record<string, unknown>).actions as Array<
                          Record<string, unknown>
                        >) &&
                          (generatedRule as Record<string, unknown>).actions.map(
                            (action: Record<string, unknown>, i: number) => (
                              <div
                                key={i}
                                className="flex flex-col gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100"
                              >
                                <div className="flex items-center gap-2 text-indigo-700 font-bold bg-indigo-50 px-2 py-1 rounded-md text-xs w-fit">
                                  {action.type as string}
                                </div>
                                <p className="text-sm font-medium text-slate-600 italic">
                                  "
                                  {((action.config as Record<string, unknown>).message as string) ||
                                    JSON.stringify(action.config)}
                                  "
                                </p>
                              </div>
                            ),
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2rem] p-6 text-slate-300">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                    <Terminal size={14} />
                    JSON Payload
                  </span>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                </div>
                <pre className="text-xs font-mono overflow-x-auto p-2 bg-slate-800/50 rounded-xl">
                  {JSON.stringify(generatedRule, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle size={16} />
            <p className="text-xs font-medium italic">
              Vui lòng kiểm tra kỹ quy tắc trước khi kích hoạt.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-4 font-black text-slate-500 hover:bg-slate-100 rounded-2xl transition-all uppercase text-xs"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!generatedRule || saveMutation.isPending}
              className="px-8 py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 text-white rounded-2xl font-black shadow-2xl shadow-brand-600/30 transition-all active:scale-95 flex items-center gap-2 uppercase text-xs"
            >
              {saveMutation.isPending ? (
                'Đang lưu...'
              ) : (
                <>
                  <Check size={18} />
                  <span>Xác nhận & Kích hoạt</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

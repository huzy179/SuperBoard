'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Terminal,
  Play,
  Settings2,
  Trash2,
  Plus,
  ShieldCheck,
  Cpu,
  ArrowRight,
} from 'lucide-react';
import type { WorkflowRuleDTO } from '@superboard/shared';

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

  useEffect(() => {
    fetchRules();
  }, [workspaceId, projectId]);

  const fetchRules = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/v1/automation?workspaceId=${workspaceId}${projectId ? `&projectId=${projectId}` : ''}`,
      );
      const data = await res.json();
      setRules(data.data || []);
    } catch (err) {
      console.error('Failed to fetch rules', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      // Logic would call POST /api/v1/automation/generate in real impl
      // For demo, we simulate the AI response
      const res = await fetch('/api/v1/automation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const generated = await res.json();

      // Persist the generated rule
      const saveRes = await fetch('/api/v1/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...generated.data,
          workspaceId,
          projectId,
        }),
      });

      if (saveRes.ok) {
        setPrompt('');
        fetchRules();
      }
    } catch (err) {
      console.error('Generation failed', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleRule = async (ruleId: string, current: boolean) => {
    try {
      await fetch(`/api/v1/automation/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchRules();
    } catch (err) {
      console.error('Toggle failed', err);
    }
  };

  const deleteRule = async (ruleId: string) => {
    try {
      await fetch(`/api/v1/automation/${ruleId}`, { method: 'DELETE' });
      fetchRules();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-slate-950/40 backdrop-blur-3xl border-l border-white/5 shadow-2xl z-[150] animate-in slide-in-from-right duration-500 font-sans flex flex-col">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-glow-brand">
            <Zap size={24} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              Tự động hóa
            </h2>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
              Quy tắc Workspace
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-3 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto elite-scrollbar p-10 space-y-16">
        {/* AI Rule Generator */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Terminal size={14} className="text-brand-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
              Tạo quy tắc mới
            </h3>
          </div>
          <div className="relative group">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="VD: 'THÔNG BÁO NẾU TASK DONE KHÔNG CÓ TÓM TẮT'..."
              className="w-full h-32 bg-slate-900/60 border border-white/5 rounded-3xl p-6 text-sm font-bold text-white placeholder:text-white/5 outline-none focus:border-brand-500/30 transition-all resize-none uppercase tracking-tighter"
            />
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className={`absolute bottom-6 right-6 px-6 py-3 rounded-2xl flex items-center gap-3 transition-all duration-500 ${
                isGenerating || !prompt.trim()
                  ? 'bg-white/5 text-white/20'
                  : 'bg-brand-500 text-slate-950 shadow-glow-brand hover:scale-105 active:scale-95'
              }`}
            >
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isGenerating ? 'Đang xử lý...' : 'Tạo'}
              </span>
              <Play size={14} fill="currentColor" />
            </button>
          </div>
        </section>

        {/* Existing Protocols */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck size={14} className="text-emerald-400" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Quy tắc đang hoạt động
              </h3>
            </div>
            <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
              {rules.length} quy tắc
            </span>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center gap-4 text-white/10">
                <Cpu size={32} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Đang phân tích...
                </span>
              </div>
            ) : rules.length > 0 ? (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className={`relative group overflow-hidden rounded-[2.5rem] border p-8 transition-all duration-700 ${
                    rule.isActive
                      ? 'bg-white/[0.02] border-white/5 hover:border-brand-500/20 shadow-glass'
                      : 'bg-white/[0.01] border-white/[0.02] grayscale opacity-40'
                  }`}
                >
                  <div className="flex items-start justify-between relative z-10">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-brand-500 animate-pulse shadow-glow-brand' : 'bg-white/20'}`}
                        />
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">
                          {rule.name}
                        </h4>
                      </div>
                      <p className="text-[10px] font-medium text-white/30 uppercase leading-relaxed max-w-[80%]">
                        {rule.description || 'Quy tắc tự động hóa AI'}
                      </p>

                      <div className="flex items-center gap-4 pt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[8px] font-black uppercase text-white/20 tracking-widest">
                            Trigger
                          </span>
                          <span className="text-[9px] font-bold text-white/80 uppercase tracking-tighter">
                            {rule.trigger.type}
                          </span>
                        </div>
                        <ArrowRight size={12} className="text-white/10" />
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-brand-500/10 border border-brand-500/10">
                          <span className="text-[8px] font-black uppercase text-brand-500/40 tracking-widest">
                            Action
                          </span>
                          <span className="text-[9px] font-bold text-brand-400 uppercase tracking-tighter">
                            {rule.actions[0]?.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleRule(rule.id, rule.isActive)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                          rule.isActive
                            ? 'bg-brand-500/20 border-brand-500/30 text-brand-400 shadow-glow-brand hover:bg-brand-500 hover:text-white'
                            : 'bg-white/5 border-white/5 text-white/20 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <Settings2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteRule(rule.id)}
                        className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-white/20 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30 transition-all duration-500"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4 border border-dashed border-white/5 rounded-[3rem]">
                <Plus size={32} className="mx-auto text-white/5" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/10">
                  Chưa có quy tắc nào
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="p-8 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-emerald" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
            Engine AI đang hoạt động
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">
            Dự phòng: Hệ thống dự phòng hoạt động
          </span>
        </div>
      </div>
    </div>
  );
}

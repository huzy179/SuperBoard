'use client';

import { useState } from 'react';
import { Zap, X, Code, Play, Copy, CheckCircle2, RefreshCw, Sparkles, Command } from 'lucide-react';
import { toast } from 'sonner';

interface TestGeneratorModalProps {
  onClose: () => void;
}

export function TestGeneratorModal({ onClose }: TestGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/v1/qa/generate-spec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const body = await res.json();
      if (res.ok) {
        setGeneratedCode(body.data.spec);
        toast.success('Neural Test Spec Generated Successfully');
      }
    } catch {
      toast.error('Test generation failed');
    } finally {
      setIsGenerating(null);
    }
  };

  const copyToClipboard = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    toast.success('Code copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[200] flex items-center justify-center p-10 animate-in fade-in zoom-in-95 duration-500 font-sans backdrop-blur-3xl">
      <div className="relative w-full max-w-6xl h-[80vh] bg-black/60 border border-white/10 rounded-[4rem] shadow-luxe overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-10 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
              <Sparkles size={28} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">
                Autonomous Test Factory
              </h2>
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Synthetic Logic Simulation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/5"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex gap-px bg-white/5 overflow-hidden">
          {/* Left Side: Prompt */}
          <div className="w-1/3 bg-black/40 p-10 flex flex-col gap-6">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                <Command size={10} /> Mission Specification
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Test that a user can create a project, invite a member, and post a comment within 30 seconds."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white placeholder:text-white/10 focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none resize-none scrollbar-hide"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-5 rounded-3xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-indigo-500 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-glow-indigo disabled:opacity-50 disabled:scale-100"
            >
              {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
              {isGenerating ? 'Synthesizing...' : 'Generate Neural Spec'}
            </button>

            <div className="mt-auto p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10">
              <p className="text-[10px] font-medium text-amber-500/60 leading-relaxed italic">
                Synthetic tests utilize the Page Object Model (POM) and assume standard workspace
                authentication middleware.
              </p>
            </div>
          </div>

          {/* Right Side: Generated Code */}
          <div className="flex-1 bg-black p-10 relative flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-white/5 text-white/40">
                  <Code size={16} />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">
                  generated_spec.ts
                </span>
              </div>
              {generatedCode && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"
                  >
                    {isCopied ? (
                      <CheckCircle2 size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                    {isCopied ? 'Copied' : 'Copy Code'}
                  </button>
                  <button className="px-4 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/30 transition-all flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest shadow-glow-indigo">
                    <Play size={12} /> Sync & Run
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 rounded-[2rem] bg-slate-900/50 border border-white/5 p-8 overflow-auto font-mono text-xs text-white/60 leading-relaxed scrollbar-hide">
              {generatedCode ? (
                <pre className="whitespace-pre-wrap">{generatedCode}</pre>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                  <Zap size={48} className="text-white animate-pulse" />
                  <span className="uppercase tracking-[0.4em] font-black text-[10px]">
                    Awaiting Synthetic Input
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

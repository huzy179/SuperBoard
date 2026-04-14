'use client';

import { useState } from 'react';
import { X, Activity, BookOpen, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { KnowledgeGraphView } from '@/features/knowledge/components/knowledge-graph-view';
import { toast } from 'sonner';

interface KnowledgeMapProps {
  projectId: string;
  onClose: () => void;
  onSelectNode?: (nodeId: string, type: 'task' | 'doc' | 'user', label: string) => void;
}

export function KnowledgeMap({ projectId, onClose, onSelectNode }: KnowledgeMapProps) {
  const [isGeneratingDiary, setIsGeneratingDiary] = useState(false);

  const handleGenerateDiary = async () => {
    setIsGeneratingDiary(true);
    try {
      const res = await fetch(`/api/v1/knowledge/diary/${projectId}`, { method: 'POST' });
      const body = await res.json();
      if (res.ok) {
        toast.success('Successfully generated weekly Dev Diary');
      } else {
        throw new Error(body.message);
      }
    } catch (err: unknown) {
      toast.error(`Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingDiary(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 z-[200] flex flex-col animate-in fade-in zoom-in-95 duration-500 font-sans backdrop-blur-3xl">
      {/* Header */}
      <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-glow-brand ring-1 ring-white/10">
            <Activity size={28} className="animate-pulse" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              Knowledge Architecture
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                Neural Semantic Web
              </span>
              <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-ping" />
              <span className="text-[10px] font-bold text-brand-500/80 uppercase tracking-widest leading-none">
                V5.0 NEURAL_GRAPH_RUNTIME
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Action: Generate Diary */}
          <button
            onClick={handleGenerateDiary}
            disabled={isGeneratingDiary}
            className="group relative flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-white/5 border border-indigo-500/20 text-indigo-400 font-black text-[10px] uppercase tracking-widest hover:bg-white/10 hover:border-indigo-500/40 transition-all disabled:opacity-50"
          >
            {isGeneratingDiary ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <BookOpen size={14} className="group-hover:rotate-12 transition-transform" />
            )}
            {isGeneratingDiary ? 'Synthesizing...' : 'Generate Dev Diary'}
            <div className="absolute -top-1 -right-1">
              <Sparkles size={10} className="text-white animate-pulse" />
            </div>
          </button>

          <div className="w-px h-10 bg-white/10" />

          <button
            onClick={onClose}
            className="w-14 h-14 rounded-2xl bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center border border-white/5 hover:border-white/10 hover:rotate-90"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Graph View */}
      <div className="flex-1 p-10 relative">
        <KnowledgeGraphView projectId={projectId} onSelectNode={onSelectNode} />

        {/* Semantic Sidebar / Overlay Hint */}
        <div className="absolute bottom-20 right-20 max-w-sm p-8 rounded-[2.5rem] bg-black/60 border border-white/5 backdrop-blur-2xl space-y-4">
          <div className="flex items-center gap-3">
            <Zap size={14} className="text-brand-400" />
            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">
              Neural Linkage Protocol
            </span>
          </div>
          <p className="text-[11px] font-medium text-white/30 leading-relaxed italic">
            Relationships are established by intersecting vector embeddings and manual task-doc
            mappings. Distance represents mission-knowledge cohesion.
          </p>
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-6 border-t border-white/5 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">
            Architecture: FORCE_DIRECTED_2D_PHYSICS
          </span>
          <div className="h-1 w-1 bg-white/10 rounded-full" />
          <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/10">
            Integrity: VERIFIED_BLOCKCHAIN_STATE
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { Book, History, Sparkles, User, ArrowRight, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  generateProjectMemoir,
  getProjectMemoirs,
  type ProjectMemoir,
} from '../api/executive-service';

export function ProjectMemoirGallery({ projectId }: { projectId: string }) {
  const [memoirs, setMemoirs] = useState<ProjectMemoir[]>([]);
  const [selectedMemoir, setSelectedMemoir] = useState<ProjectMemoir | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePersona, setActivePersona] = useState('executive');

  useEffect(() => {
    fetchMemoirs();
  }, [projectId]);

  const fetchMemoirs = async () => {
    try {
      setMemoirs(await getProjectMemoirs(projectId));
    } catch {
      toast.error('Không tải được memoir');
    }
  };

  const generateMemoir = async () => {
    setIsGenerating(true);
    try {
      await generateProjectMemoir(projectId, activePersona);
      toast.success('Đã tạo memoir thành công');
      fetchMemoirs();
    } catch {
      toast.error('Tạo memoir thất bại');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-var(--space-10) p-var(--space-10) bg-white/[0.01] rounded-md border border-white/10 min-h-[700px] relative overflow-hidden backdrop-blur-2xl shadow-inner">
      {/* Cinematic Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 rounded-sm bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center shadow-inner">
            <Book size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              Project_Archives
            </h2>
            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] mt-0.5">
              Operational_History_Log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950/40 border border-white/5 p-1 rounded-sm">
            {['executive', 'technical', 'celebratory'].map((p) => (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`px-4 py-1.5 rounded-xs text-[9px] font-bold uppercase tracking-widest transition-all ${
                  activePersona === p
                    ? 'bg-white text-slate-950 shadow-inner'
                    : 'text-white/20 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={generateMemoir}
            disabled={isGenerating}
            className="px-6 py-3 rounded-sm bg-brand-500/10 border border-brand-500/20 text-brand-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-brand-500/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? <History size={14} className="animate-spin" /> : <Plus size={14} />}
            Generate_Memoir
          </button>
        </div>
      </div>

      {/* Grid of Memoirs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {memoirs.map((memoir) => (
          <div
            key={memoir.id}
            onClick={() => setSelectedMemoir(memoir)}
            className="aspect-[4/5] p-var(--space-8) rounded-md bg-white/[0.01] border border-white/5 hover:border-brand-500/20 hover:bg-white/[0.02] transition-all cursor-pointer group flex flex-col justify-between shadow-inner relative overflow-hidden"
          >
            <div>
              <div className="flex items-center gap-3 mb-var(--space-6)">
                <span className="px-var(--space-2) py-0.5 bg-brand-500/10 text-[8px] font-bold text-brand-400 rounded-xs uppercase tracking-widest border border-brand-500/20">
                  {memoir.persona}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[9px] font-bold text-white/10 font-mono tracking-tight">
                  {new Date(memoir.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-xl font-black text-white leading-tight tracking-tight uppercase group-hover:text-brand-400 transition-colors">
                {memoir.title}
              </h3>
            </div>

            <div className="flex items-end justify-between">
              <div className="w-10 h-10 rounded-full border border-white/5 flex items-center justify-center text-white/10 group-hover:bg-brand-500/5 group-hover:text-brand-400 transition-all">
                <Sparkles size={18} />
              </div>
              <div className="flex items-center gap-2 text-[9px] font-bold text-white/20 uppercase tracking-widest">
                Access_Node
                <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}

        {memoirs.length === 0 && !isGenerating && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-30">
            <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center text-white/20">
              <History size={40} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30">
              Chưa có tài liệu nào
            </span>
          </div>
        )}
      </div>

      {/* Immersive Modal Reader */}
      {selectedMemoir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500">
          <button
            onClick={() => setSelectedMemoir(null)}
            className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-all border border-white/5"
          >
            <X size={28} />
          </button>

          <div className="w-full max-w-3xl max-h-full overflow-y-auto bg-slate-950/95 backdrop-blur-3xl rounded-md p-var(--space-12) shadow-inner border border-white/10 relative animate-in slide-in-from-bottom-4 duration-500 scrollbar-hide select-none">
            <div className="flex flex-col items-center text-center mb-var(--space-12) px-var(--space-10)">
              <div className="flex items-center gap-4 mb-var(--space-6)">
                <span className="h-px w-8 bg-white/10" />
                <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">
                  {selectedMemoir.persona}
                </span>
                <span className="h-px w-8 bg-white/10" />
              </div>
              <h2 className="text-4xl font-black text-white tracking-tighter leading-tight uppercase mb-4">
                {selectedMemoir.title}
              </h2>
              <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">
                Timestamp: {new Date(selectedMemoir.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="space-y-8 text-white/70 leading-relaxed">
              {selectedMemoir.content.split('\n\n').map((para, i) => (
                <p key={i} className="mb-6">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-20 pt-10 border-t border-white/5 flex items-center justify-between text-white/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20">
                  <User size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  Lưu trữ bởi SuperBoard
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

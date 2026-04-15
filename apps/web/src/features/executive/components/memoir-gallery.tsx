'use client';

import { useState, useEffect } from 'react';
import { Book, History, Sparkles, User, ArrowRight, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Memoir {
  id: string;
  title: string;
  content: string;
  persona: string;
  createdAt: string;
}

export function ProjectMemoirGallery({ projectId }: { projectId: string }) {
  const [memoirs, setMemoirs] = useState<Memoir[]>([]);
  const [selectedMemoir, setSelectedMemoir] = useState<Memoir | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activePersona, setActivePersona] = useState('executive');

  useEffect(() => {
    fetchMemoirs();
  }, [projectId]);

  const fetchMemoirs = async () => {
    try {
      const res = await fetch(`/api/v1/executive/projects/${projectId}/memoirs`);
      const body = await res.json();
      if (res.ok) setMemoirs(body.data);
    } catch {
      toast.error('Không tải được memoir');
    }
  };

  const generateMemoir = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/v1/executive/projects/${projectId}/memoir`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona: activePersona }),
      });
      if (res.ok) {
        toast.success('Đã tạo memoir thành công');
        fetchMemoirs();
      }
    } catch {
      toast.error('Tạo memoir thất bại');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-white/[0.02] rounded-[2.5rem] border border-white/5 min-h-[800px] relative overflow-hidden backdrop-blur-3xl">
      {/* Cinematic Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center">
            <Book size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              Tài liệu dự án
            </h2>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-1">
              Nhật ký hoạt động dự án
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-white/[0.03] border border-white/5 p-1.5 rounded-2xl">
            {['executive', 'technical', 'celebratory'].map((p) => (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activePersona === p
                    ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={generateMemoir}
            disabled={isGenerating}
            className="px-8 py-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-brand-500/20 transition-all disabled:opacity-50"
          >
            {isGenerating ? <History size={16} className="animate-spin" /> : <Plus size={16} />}
            Tạo memoir
          </button>
        </div>
      </div>

      {/* Grid of Memoirs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {memoirs.map((memoir) => (
          <div
            key={memoir.id}
            onClick={() => setSelectedMemoir(memoir)}
            className="aspect-[3/4] p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-brand-500/20 hover:bg-white/[0.03] transition-all cursor-pointer group flex flex-col justify-between shadow-glass"
          >
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="px-3 py-1 bg-brand-500/10 text-[9px] font-black text-brand-400 rounded-lg uppercase tracking-widest border border-brand-500/20 italic">
                  {memoir.persona}
                </span>
                <div className="flex-1 h-px bg-white/5" />
                <span className="text-[10px] font-bold text-white/30 font-mono tracking-tighter">
                  {new Date(memoir.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-2xl font-black text-white leading-tight tracking-tighter uppercase italic group-hover:text-brand-400 transition-colors">
                {memoir.title}
              </h3>
            </div>

            <div className="flex items-end justify-between">
              <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center text-white/20 group-hover:bg-brand-500/10 group-hover:text-brand-400 transition-all">
                <Sparkles size={20} />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest">
                Xem thêm
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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

          <div className="w-full max-w-4xl max-h-full overflow-y-auto bg-slate-950/90 backdrop-blur-3xl rounded-[3rem] p-20 shadow-glass border border-white/5 relative animate-in slide-in-from-bottom-10 duration-700 scrollbar-hide select-none">
            <div className="flex flex-col items-center text-center mb-16 px-10">
              <div className="flex items-center gap-4 mb-8">
                <span className="h-px w-10 bg-white/10" />
                <span className="text-[11px] font-black text-brand-400 uppercase tracking-[0.4em] italic">
                  {selectedMemoir.persona}
                </span>
                <span className="h-px w-10 bg-white/10" />
              </div>
              <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] uppercase italic mb-6">
                {selectedMemoir.title}
              </h2>
              <span className="text-xs font-bold text-white/30 tracking-[0.2em]">
                {new Date(selectedMemoir.createdAt).toLocaleDateString()}
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

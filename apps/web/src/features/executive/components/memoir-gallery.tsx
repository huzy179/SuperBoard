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
      toast.error('Failed to load memoirs');
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
        toast.success('Project Memoir synthesized successfully');
        fetchMemoirs();
      }
    } catch {
      toast.error('Synthesis failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 p-10 bg-slate-50/50 rounded-[3rem] border border-slate-200/50 min-h-[800px] relative overflow-hidden backdrop-blur-xl">
      {/* Cinematic Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-[2rem] bg-indigo-600 text-white flex items-center justify-center shadow-glow-indigo">
            <Book size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">
              Narrative Archives
            </h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1">
              Transforming Mission Data into Legend
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/50">
            {['executive', 'technical', 'celebratory'].map((p) => (
              <button
                key={p}
                onClick={() => setActivePersona(p)}
                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activePersona === p
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={generateMemoir}
            disabled={isGenerating}
            className="px-8 py-4 rounded-2xl bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-glow-indigo disabled:opacity-50"
          >
            {isGenerating ? <History size={16} className="animate-spin" /> : <Plus size={16} />}
            Synthesize Memoir
          </button>
        </div>
      </div>

      {/* Grid of Memoirs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
        {memoirs.map((memoir) => (
          <div
            key={memoir.id}
            onClick={() => setSelectedMemoir(memoir)}
            className="aspect-[3/4] p-10 rounded-[3rem] bg-white border border-slate-200 shadow-glass hover:shadow-glass-xl hover:-translate-y-2 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-3 mb-8">
                <span className="px-3 py-1 bg-indigo-50 text-[9px] font-black text-indigo-600 rounded-lg uppercase tracking-widest border border-indigo-100 italic">
                  {memoir.persona}
                </span>
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tighter">
                  {new Date(memoir.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter uppercase italic group-hover:text-indigo-600 transition-colors">
                {memoir.title}
              </h3>
            </div>

            <div className="flex items-end justify-between">
              <div className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 transition-all">
                <Sparkles size={20} className="group-hover:text-indigo-400" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Read Story{' '}
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        ))}

        {memoirs.length === 0 && !isGenerating && (
          <div className="col-span-full py-40 flex flex-col items-center justify-center gap-6 opacity-30">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-400 flex items-center justify-center text-slate-400">
              <History size={40} />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.5em]">
              No Chronicles Found
            </span>
          </div>
        )}
      </div>

      {/* Immersive Modal Reader */}
      {selectedMemoir && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-10 bg-slate-950/80 backdrop-blur-2xl animate-in fade-in duration-500">
          <button
            onClick={() => setSelectedMemoir(null)}
            className="absolute top-10 right-10 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10"
          >
            <X size={28} />
          </button>

          <div className="w-full max-w-4xl max-h-full overflow-y-auto bg-white rounded-[4rem] p-20 shadow-2xl relative animate-in slide-in-from-bottom-10 duration-700 scrollbar-hide select-none">
            <div className="flex flex-col items-center text-center mb-16 px-10">
              <div className="flex items-center gap-4 mb-8">
                <span className="h-px w-10 bg-slate-200" />
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em] italic">
                  {selectedMemoir.persona} narrative
                </span>
                <span className="h-px w-10 bg-slate-200" />
              </div>
              <h2 className="text-5xl font-black text-slate-950 tracking-tighter leading-[0.9] uppercase italic mb-6">
                {selectedMemoir.title}
              </h2>
              <span className="text-xs font-bold text-slate-400 tracking-[0.2em]">
                {new Date(selectedMemoir.createdAt).toUTCString()}
              </span>
            </div>

            <div className="prose prose-slate prose-lg max-w-none text-slate-800 font-serif leading-relaxed space-y-8 first-letter:text-7xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-indigo-600">
              {/* Simplified markdown display - in real app use react-markdown */}
              {selectedMemoir.content.split('\n\n').map((para, i) => (
                <p key={i} className="mb-6">
                  {para}
                </p>
              ))}
            </div>

            <div className="mt-20 pt-10 border-t border-slate-100 flex items-center justify-between text-slate-400">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <User size={18} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest italic">
                  Archived by SuperBoard Neural Brain
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

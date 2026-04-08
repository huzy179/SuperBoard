'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getPublicDoc } from '@/features/docs/api/doc-service';
import { RichTextEditor } from '@/features/docs/components/RichTextEditor';
import { User, Clock, ShieldCheck, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export default function PublicDocPage() {
  const params = useParams<{ docId: string }>();

  const {
    data: doc,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['public-doc', params.docId],
    queryFn: () => getPublicDoc(params.docId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent shadow-md" />
          <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
            SuperBoard • Loading
          </p>
        </div>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-200 p-10 text-center animate-in fade-in zoom-in duration-500">
          <div className="mx-auto w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100">
            <ShieldCheck size={32} className="text-red-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Access Denied</h1>
          <p className="text-slate-500 text-[15px] leading-relaxed mb-8">
            Tài liệu này không tồn tại hoặc đã được thu hồi quyền truy cập công khai. Vui lòng liên
            hệ với chủ sở hữu.
          </p>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all active:scale-95"
          >
            Về trang chủ SuperBoard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-brand-100 selection:text-brand-900">
      {/* Dynamic Navigation Header */}
      <nav className="h-16 flex items-center justify-between px-8 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-lg transform -rotate-12">
            <span className="text-white font-black text-xl leading-none">S</span>
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tighter">
            SuperBoard <span className="text-brand-600">Public</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <Globe size={12} className="text-emerald-600" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
              Public Access Granted
            </span>
          </div>
        </div>
      </nav>

      {/* Document Surface */}
      <main className="flex-1 max-w-5xl mx-auto w-full py-16 px-6 lg:px-12 animate-in slide-in-from-bottom-12 duration-1000">
        <article className="bg-white rounded-[40px] shadow-2xl border border-slate-200 min-h-[80vh] overflow-hidden p-12 lg:p-24 relative">
          {/* Watermark Decoration */}
          <div className="absolute top-10 right-10 flex flex-col items-end opacity-[0.03] pointer-events-none select-none">
            <span className="text-8xl font-black italic">SUPER</span>
            <span className="text-8xl font-black italic -mt-8">BOARD</span>
          </div>

          <header className="mb-16 relative">
            <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.1] mb-8 tracking-tighter decoration-brand-500/30 underline-offset-8">
              {doc.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3 group">
                <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-inner group-hover:scale-110 transition-transform">
                  <User size={20} className="text-slate-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Author
                  </span>
                  <span className="text-[14px] font-bold text-slate-800 leading-none">
                    @{doc.creator?.fullName.split(' ').join('').toLowerCase()}
                  </span>
                </div>
              </div>

              <div className="h-10 w-px bg-slate-100" />

              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200 shadow-inner">
                  <Clock size={20} className="text-slate-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                    Last Updated
                  </span>
                  <span className="text-[14px] font-bold text-slate-800 leading-none">
                    {format(new Date(doc.updatedAt), 'dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <section className="prose prose-slate lg:prose-xl max-w-none prose-h1:text-4xl prose-h1:font-black prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-2xl selection:bg-brand-500/20">
            <RichTextEditor content={doc.content} onChange={() => {}} editable={false} />
          </section>

          <footer className="mt-32 pt-12 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-8 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all group/footer">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-400">Published with</span>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner group-hover/footer:border-brand-200 group-hover/footer:bg-brand-50 transition-colors">
                <div className="h-4 w-4 bg-brand-600 rounded flex items-center justify-center text-white text-[10px] font-black">
                  S
                </div>
                <span className="text-[12px] font-black text-slate-900 tracking-tighter">
                  SuperBoard
                </span>
              </div>
            </div>
            <p className="text-[12px] font-medium text-slate-400 text-center lg:text-right">
              All rights reserved. Powered by SuperBoard Unified Workspace Engine.
            </p>
          </footer>
        </article>
      </main>

      {/* Floating CTA for Guests */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-2 duration-500 delay-1000">
        <button
          onClick={() => (window.location.href = '/')}
          className="px-8 py-4 bg-slate-900 text-white rounded-full font-black shadow-2xl flex items-center gap-3 border border-slate-700 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all group"
        >
          <span>Start your own Workspace</span>
          <div className="h-6 w-6 bg-brand-600 rounded flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Globe size={14} />
          </div>
        </button>
      </div>
    </div>
  );
}

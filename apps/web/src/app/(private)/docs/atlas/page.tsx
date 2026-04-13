'use client';

import { VectorAtlas } from '@/features/knowledge/components/VectorAtlas';
import { BrainCircuit, ChevronLeft, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function DocsAtlasPage() {
  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 shadow-glow-indigo/10">
              <BrainCircuit className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
              Intelligence Sector
            </span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white uppercase leading-none">
            Vector <span className="text-indigo-400">Atlas</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/docs"
            className="flex items-center gap-3 px-6 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-[10px] font-black text-white/40 uppercase tracking-widest hover:text-white hover:border-white/20 hover:bg-white/[0.05] transition-all group"
          >
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Registry
          </Link>
          <div className="h-10 w-px bg-white/10 hidden md:block" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
              Mode
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse shadow-glow-indigo" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Semantic_Scan
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Vector Atlas Map & Strategic Insight */}
      <VectorAtlas />

      {/* Narrative Footer */}
      <div className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.01] flex items-center justify-between gap-8 backdrop-blur-3xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
            <LayoutGrid className="h-5 w-5 text-white/20" />
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
              Cognitive Mapping Active
            </p>
            <p className="text-[13px] font-bold text-white uppercase tracking-wider">
              Semantic adjacency is analyzed across all Mission Protocols.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

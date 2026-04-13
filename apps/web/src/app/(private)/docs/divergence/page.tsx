'use client';

import { ConflictResolver } from '@/features/knowledge/components/ConflictResolver';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function DivergencePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-7xl mx-auto py-12 px-6">
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Nexus</span>
        </button>

        <ConflictResolver />
      </div>
    </div>
  );
}

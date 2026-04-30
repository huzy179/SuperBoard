'use client';

import { ConflictResolver } from '@/features/intelligence/knowledge/components/ConflictResolver';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function DivergencePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-surface-bg text-[color:var(--color-ink)]">
      <div className="max-w-7xl mx-auto py-10 px-6 space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)] transition-colors"
        >
          <ChevronLeft size={16} />
          <span className="text-sm font-semibold">Back</span>
        </button>

        <ConflictResolver />
      </div>
    </div>
  );
}

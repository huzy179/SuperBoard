'use client';

import Link from 'next/link';
import { BrainCircuit, ChevronLeft, LayoutGrid } from 'lucide-react';
import { VectorAtlas } from '@/features/intelligence/knowledge/components/VectorAtlas';

export default function DocsAtlasPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold text-[color:var(--color-ink)]">
              Vector Atlas
            </span>
          </div>
          <p className="text-sm text-[color:var(--color-muted)] max-w-2xl">
            Bản đồ tri thức: xem các node (docs/tasks) và mức liên kết theo ngữ nghĩa.
          </p>
        </div>

        <Link
          href="/docs"
          className="inline-flex items-center gap-2 rounded-sm border border-surface-border bg-surface-card px-4 py-2 text-sm font-semibold text-[color:var(--color-ink)] hover:bg-black/[0.03] transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Link>
      </header>

      <VectorAtlas />

      <footer className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-6 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)]">
          <LayoutGrid className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[color:var(--color-ink)]">Gợi ý</p>
          <p className="text-sm text-[color:var(--color-muted)]">
            Click vào node để xem chi tiết. (Màn này sẽ được đồng bộ tiếp về tone Notion.)
          </p>
        </div>
      </footer>
    </div>
  );
}

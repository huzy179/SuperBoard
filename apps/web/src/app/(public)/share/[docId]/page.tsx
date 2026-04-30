'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getPublicDoc } from '@/features/collaboration/docs/api/doc-service';
import { RichTextEditor } from '@/features/collaboration/docs/components/RichTextEditor';
import { Clock, Globe, User } from 'lucide-react';
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
      <main className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          Đang tải tài liệu…
        </div>
      </main>
    );
  }

  if (isError || !doc) {
    return (
      <main className="min-h-screen bg-surface-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-xl border border-surface-border bg-surface-card p-8 shadow-sm">
          <h1 className="text-lg font-semibold text-[color:var(--color-ink)]">
            Không thể truy cập tài liệu
          </h1>
          <p className="mt-2 text-sm text-[color:var(--color-muted)] leading-relaxed">
            Tài liệu không tồn tại hoặc đã bị thu hồi quyền truy cập công khai.
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="mt-6 w-full btn btn-primary"
          >
            Về trang chủ
          </button>
        </div>
      </main>
    );
  }

  const authorHandle = doc.creator?.fullName
    ? `@${doc.creator.fullName.split(' ').join('').toLowerCase()}`
    : '—';

  return (
    <div className="min-h-screen bg-surface-bg font-sans">
      <header className="sticky top-0 z-10 border-b border-surface-border bg-surface-card">
        <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-brand-500 text-white font-semibold">
              S
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                SuperBoard
              </span>
              <span className="text-[11px] text-[color:var(--color-muted)]">Public document</span>
            </div>
          </div>

          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            <Globe size={14} className="text-emerald-600" />
            Công khai
          </span>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
        <article className="mx-auto max-w-4xl rounded-xl border border-surface-border bg-surface-card p-8 sm:p-10 shadow-luxe">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[color:var(--color-ink)] leading-tight">
            {doc.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[color:var(--color-muted)]">
            <span className="inline-flex items-center gap-2">
              <User size={16} className="text-[color:var(--color-faint)]" />
              {authorHandle}
            </span>
            <span className="h-4 w-px bg-surface-border" aria-hidden />
            <span className="inline-flex items-center gap-2">
              <Clock size={16} className="text-[color:var(--color-faint)]" />
              Cập nhật {format(new Date(doc.updatedAt), 'dd/MM/yyyy', { locale: vi })}
            </span>
          </div>

          <div className="mt-8">
            <RichTextEditor content={doc.content} onChange={() => {}} editable={false} />
          </div>
        </article>
      </main>
    </div>
  );
}

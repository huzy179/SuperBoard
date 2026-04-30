'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/system/auth/hooks/use-auth-session';
import { useDoc, useSummarizeDoc } from '@/features/collaboration/docs/hooks/use-doc';
import { RichTextEditor } from '@/features/collaboration/docs/components/RichTextEditor';
import { DocTOC } from '@/features/collaboration/docs/components/DocTOC';
import { DocVersionSidebar } from '@/features/collaboration/docs/components/DocVersionSidebar';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { AppButton } from '@/components/ui/app-button';

export default function DocDetailPage() {
  const params = useParams<{ docId: string }>();
  const [showVersions, setShowVersions] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const { user } = useAuthSession();

  const {
    data: doc,
    isLoading,
    isError,
    error,
    localTitle,
    setLocalTitle,
    localContent,
    setLocalContent,
    isSaving,
    refetch: reloadDoc,
  } = useDoc(params.docId);

  const summarizeMutation = useSummarizeDoc();

  const handleSummarize = async () => {
    try {
      const result = await summarizeMutation.mutateAsync(params.docId);
      setAiSummary(result.summary);
      toast.success('Đã tạo tóm tắt');
    } catch (err) {
      console.error('Failed to summarize doc:', err);
      toast.error('Không thể tạo tóm tắt');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="flex items-center gap-3 text-sm text-[color:var(--color-muted)]">
          <Loader2 size={16} className="animate-spin" />
          Loading…
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-full items-center justify-center p-10">
        <div className="w-full max-w-lg rounded-lg border border-surface-border bg-surface-card shadow-luxe p-6">
          <h3 className="text-base font-semibold text-[color:var(--color-ink)]">
            Không tải được tài liệu
          </h3>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            {error?.message || 'Vui lòng thử lại.'}
          </p>
          <div className="mt-4">
            <AppButton type="button" variant="primary" size="md" onClick={() => reloadDoc()}>
              Thử lại
            </AppButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-bg">
      <header className="sticky top-0 z-50 h-16 shrink-0 border-b border-surface-border bg-surface-card">
        <div className="h-full max-w-[1700px] mx-auto px-[var(--space-6)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`h-2 w-2 rounded-full ${isSaving ? 'bg-brand-500' : 'bg-emerald-500'}`}
              aria-hidden
            />
            <span className="text-sm font-semibold text-[color:var(--color-ink)] truncate">
              {localTitle?.trim() ? localTitle : 'Untitled'}
            </span>
            <span className="text-xs text-[color:var(--color-faint)]">
              {isSaving ? 'Saving…' : 'Saved'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              leftIcon={<Sparkles size={14} />}
              isLoading={Boolean(summarizeMutation.isPending)}
              onClick={handleSummarize}
            >
              Summarize
            </AppButton>
            <AppButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowVersions((v) => !v)}
            >
              {showVersions ? 'Close versions' : 'Versions'}
            </AppButton>
          </div>
        </div>
      </header>

      {aiSummary ? (
        <div className="max-w-[1700px] mx-auto w-full px-[var(--space-6)] pt-6">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-luxe">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-800">AI summary</p>
                <p className="mt-2 text-sm text-emerald-900/90 leading-relaxed">“{aiSummary}”</p>
              </div>
              <button
                type="button"
                onClick={() => setAiSummary(null)}
                className="h-9 w-9 rounded-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                aria-label="Close summary"
              >
                <X size={16} className="mx-auto" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto px-[var(--space-6)] py-[var(--space-8)]">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-3">
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                placeholder="Tiêu đề…"
                className="w-full -mx-2 px-2 py-1 rounded-md border-none bg-transparent text-4xl md:text-5xl font-semibold tracking-tight text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-bg"
              />

              <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--color-muted)]">
                <div className="flex items-center gap-2">
                  <AssigneeAvatar
                    name={doc?.creator?.fullName || 'User'}
                    src={doc?.creator?.avatarUrl}
                    size="sm"
                  />
                  <span className="font-medium">{doc?.creator?.fullName || 'User'}</span>
                </div>
                <span className="h-1 w-1 rounded-full bg-surface-border" aria-hidden />
                <span>
                  Updated{' '}
                  {new Date(doc?.updatedAt || '').toLocaleString('en-US', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="min-h-[700px] pb-24">
              <RichTextEditor
                docId={params.docId}
                content={localContent}
                onChange={setLocalContent}
                user={
                  user
                    ? {
                        id: user.id,
                        fullName: user.fullName,
                        avatarColor: user.avatarColor ?? undefined,
                      }
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {!showVersions ? <DocTOC content={localContent} /> : null}
        {showVersions ? (
          <DocVersionSidebar
            docId={params.docId}
            onClose={() => setShowVersions(false)}
            onRestore={setLocalContent}
          />
        ) : null}
      </div>
    </div>
  );
}

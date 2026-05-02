'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Share2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthSession } from '@/features/system/auth/hooks/use-auth-session';
import { useDoc, useSummarizeDoc } from '@/features/collaboration/docs/hooks/use-doc';
import { RichTextEditor } from '@/features/collaboration/docs/components/RichTextEditor';
import { DocTOC } from '@/features/collaboration/docs/components/DocTOC';
import { DocVersionSidebar } from '@/features/collaboration/docs/components/DocVersionSidebar';
import { AssigneeAvatar } from '@/features/operations/task/components/task-badges';
import { AppButton } from '@/components/ui/app-button';
import { updateDoc } from '@/features/collaboration/docs/api/doc-service';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function DocDetailPage() {
  const params = useParams<{ docId: string }>();
  const [showVersions, setShowVersions] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

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

  const setPublicMutation = useMutation({
    mutationFn: (isPublic: boolean) => updateDoc(params.docId, { isPublic }),
    onSuccess: (updatedDoc) => {
      queryClient.setQueryData(['doc', params.docId], updatedDoc);
      toast.success(updatedDoc.isPublic ? 'Đã bật chia sẻ công khai' : 'Đã tắt chia sẻ công khai');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Không thể cập nhật trạng thái chia sẻ');
    },
  });

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

  const publicUrl =
    typeof window !== 'undefined' && doc?.shareToken
      ? `${window.location.origin}/share/${doc.shareToken}`
      : '';

  return (
    <div className="flex flex-col h-full bg-[color:var(--color-surface-alt)]/20">
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
            <div className="relative">
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<Share2 size={14} />}
                onClick={() => setShareOpen((v) => !v)}
              >
                Share
              </AppButton>
              {shareOpen && doc ? (
                <div className="absolute right-0 top-[calc(100%+10px)] w-[360px] rounded-xl border border-surface-border bg-surface-card shadow-luxe p-4 z-50">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[color:var(--color-ink)]">
                        Chia sẻ công khai
                      </div>
                      <div className="mt-1 text-xs text-[color:var(--color-muted)] leading-relaxed">
                        Bật để bất kỳ ai có link đều xem được (read-only).
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShareOpen(false)}
                      className="h-9 w-9 rounded-md border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                      aria-label="Close share panel"
                    >
                      <X size={16} className="mx-auto" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-surface-border bg-[color:var(--color-surface-alt)]/35 px-3 py-2">
                    <div className="text-sm font-medium text-[color:var(--color-ink)]">
                      {doc.isPublic ? 'Công khai' : 'Riêng tư'}
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublicMutation.mutate(!doc.isPublic)}
                      disabled={setPublicMutation.isPending}
                      className={`h-8 px-3 rounded-md text-xs font-semibold border transition-colors ${
                        doc.isPublic
                          ? 'bg-black/[0.02] border-surface-border text-[color:var(--color-muted)] hover:bg-black/[0.04]'
                          : 'bg-brand-500 border-brand-500 text-white hover:bg-brand-600'
                      } disabled:opacity-60`}
                    >
                      {setPublicMutation.isPending
                        ? 'Đang cập nhật…'
                        : doc.isPublic
                          ? 'Tắt'
                          : 'Bật'}
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-xs font-semibold text-[color:var(--color-muted)]">
                      Link chia sẻ
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        readOnly
                        value={doc.isPublic ? publicUrl : ''}
                        placeholder="Bật công khai để tạo link"
                        className="flex-1 h-10 rounded-md border border-surface-border bg-surface-bg px-3 text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-faint)]"
                      />
                      <AppButton
                        type="button"
                        variant="secondary"
                        size="sm"
                        disabled={!doc.isPublic || !publicUrl}
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(publicUrl)
                            .then(() => toast.success('Đã copy link'))
                            .catch(() => toast.error('Không thể copy link'));
                        }}
                      >
                        Copy
                      </AppButton>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
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
          <div className="max-w-5xl mx-auto">
            <div className="rounded-xl border border-surface-border bg-surface-card shadow-sm overflow-hidden">
              <div className="px-8 pt-8 pb-6 sm:px-10">
                <div className="space-y-3">
                  <input
                    type="text"
                    value={localTitle}
                    onChange={(e) => setLocalTitle(e.target.value)}
                    placeholder="Tiêu đề…"
                    className="w-full -mx-2 px-2 py-1 rounded-md border-none bg-transparent text-3xl md:text-4xl font-semibold tracking-tight leading-tight text-[color:var(--color-ink)] placeholder:text-[color:var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
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

                  {!localContent ? (
                    <p className="text-[13px] text-[color:var(--color-faint)] leading-relaxed">
                      Mẹo: gõ <span className="font-mono">/</span> để mở lệnh nhanh, hoặc bôi đen
                      đoạn văn để dùng AI.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-surface-border bg-surface-bg/40">
                <div className="px-8 py-7 sm:px-10">
                  <div className="min-h-[720px] pb-20">
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

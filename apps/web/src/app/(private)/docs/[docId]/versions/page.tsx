'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  useDoc,
  useDocVersions,
  useRestoreDocVersion,
} from '@/features/collaboration/docs/hooks/use-doc';
import { RichTextEditor } from '@/features/collaboration/docs/components/RichTextEditor';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, Clock, RotateCcw, FileText, Check } from 'lucide-react';
import { useState } from 'react';
import type { DocVersion } from '@superboard/shared';
import { toast } from 'sonner';

export default function VersionHistoryPage() {
  const params = useParams<{ docId: string }>();
  const router = useRouter();
  const { data: doc, isLoading: docLoading } = useDoc(params.docId);
  const { data: versions, isLoading: versionsLoading } = useDocVersions(params.docId);
  const [selectedVersion, setSelectedVersion] = useState<DocVersion | null>(null);
  const restoreMutation = useRestoreDocVersion(params.docId);

  if (docLoading || versionsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex flex-1 items-center justify-center h-full p-10">
        <div className="w-full max-w-lg rounded-lg border border-surface-border bg-surface-card shadow-luxe p-6">
          <h3 className="text-base font-semibold text-[color:var(--color-ink)]">
            Không tải được tài liệu
          </h3>
          <p className="mt-2 text-sm text-[color:var(--color-muted)]">
            Không tìm thấy tài liệu hoặc bạn không có quyền truy cập.
          </p>
          <button type="button" onClick={() => router.back()} className="mt-4 btn btn-secondary">
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentContent = selectedVersion ? selectedVersion.content : doc?.content;
  const isViewingHistory = !!selectedVersion;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface-bg">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-6 bg-surface-card sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-[color:var(--color-muted)] hover:bg-black/[0.03] rounded-md transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-semibold text-[color:var(--color-ink)] leading-none mb-1">
              Lịch sử phiên bản
            </h1>
            <span className="text-[11px] text-[color:var(--color-muted)] font-medium truncate max-w-[240px]">
              {doc?.title}
            </span>
          </div>
        </div>

        {isViewingHistory && (
          <button
            onClick={() => {
              const versionId = selectedVersion?.id;
              if (!versionId) return;
              restoreMutation
                .mutateAsync(versionId)
                .then(() => {
                  setSelectedVersion(null);
                  toast.success('Đã khôi phục và quay lại bản hiện tại');
                })
                .catch(() => {
                  // toast handled in mutation
                });
            }}
            disabled={restoreMutation.isPending}
            className="flex items-center gap-2 px-3 py-2 rounded-md bg-brand-500 text-white text-[12px] font-semibold hover:bg-brand-600 transition-colors"
          >
            <RotateCcw size={14} />
            {restoreMutation.isPending ? 'Đang khôi phục…' : 'Khôi phục bản này'}
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex-1 overflow-y-auto bg-surface-bg p-6 sm:p-10 lg:p-14">
          <div className="max-w-4xl mx-auto bg-surface-card shadow-luxe rounded-xl border border-surface-border min-h-full overflow-hidden p-8 sm:p-10">
            <div className="mb-8">
              <h2 className="text-3xl sm:text-4xl font-semibold text-[color:var(--color-ink)] tracking-tight leading-tight mb-4">
                {doc?.title}
              </h2>
              {isViewingHistory && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-200 w-fit">
                  <Clock size={12} className="text-amber-600" />
                  <span className="text-[11px] font-semibold text-amber-800">
                    Đang xem bản lưu:{' '}
                    {format(new Date(selectedVersion!.savedAt), 'HH:mm dd/MM/yyyy', { locale: vi })}
                  </span>
                </div>
              )}
            </div>
            <RichTextEditor content={currentContent} onChange={() => {}} editable={false} />
          </div>
        </div>

        {/* Versions List Sidebar */}
        <aside className="w-80 shrink-0 border-l border-surface-border bg-surface-card flex flex-col overflow-hidden shadow-sm">
          <div className="px-4 py-4 border-b border-surface-border bg-surface-card">
            <h3 className="text-xs font-semibold text-[color:var(--color-ink)] mb-1">
              Lịch sử chỉnh sửa
            </h3>
            <p className="text-[12px] text-[color:var(--color-muted)]">
              Chọn một phiên bản để xem lại nội dung.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Current Version Entry */}
            <button
              onClick={() => setSelectedVersion(null)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all border text-left ${
                !selectedVersion
                  ? 'bg-[color:var(--color-surface-alt)]/35 border-brand-200'
                  : 'border-transparent hover:bg-black/[0.02]'
              }`}
            >
              <div
                className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${!selectedVersion ? 'bg-brand-600' : 'bg-black/[0.06]'}`}
              >
                <FileText
                  size={12}
                  className={!selectedVersion ? 'text-white' : 'text-[color:var(--color-muted)]'}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-[color:var(--color-ink)]">
                    Hiện tại
                  </span>
                  <span className="text-[10px] text-brand-700 font-semibold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    Đang chỉnh sửa
                  </span>
                </div>
                <p className="text-[11px] text-[color:var(--color-muted)] mt-1">
                  Phiên bản mới nhất của tài liệu.
                </p>
              </div>
            </button>

            {/* Historical Versions */}
            {versions?.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersion(v)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all border text-left ${
                  selectedVersion?.id === v.id
                    ? 'bg-[color:var(--color-surface-alt)]/35 border-brand-200'
                    : 'border-transparent hover:bg-black/[0.02]'
                }`}
              >
                <div
                  className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${selectedVersion?.id === v.id ? 'bg-brand-600 text-white' : 'bg-black/[0.04] text-[color:var(--color-faint)]'}`}
                >
                  {selectedVersion?.id === v.id ? <Check size={12} /> : <Clock size={12} />}
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-semibold text-[color:var(--color-ink)] block truncate leading-none mb-1">
                    Bản lưu {versions.length - i}
                  </span>
                  <p className="text-[11px] text-[color:var(--color-muted)] font-medium leading-none">
                    {format(new Date(v.savedAt), 'HH:mm dd/MM', { locale: vi })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

'use client';

import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { Clock, History, RotateCcw, X } from 'lucide-react';
import { AppButton } from '@/components/ui/app-button';
import { useDocVersions } from '../hooks/use-doc';

interface DocVersionSidebarProps {
  docId: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRestore: (content: any) => void;
}

export function DocVersionSidebar({ docId, onClose, onRestore }: DocVersionSidebarProps) {
  const { data: versions, isLoading } = useDocVersions(docId);

  return (
    <aside className="w-96 border-l border-surface-border bg-surface-card flex flex-col h-full shadow-glass z-50">
      <div className="p-6 border-b border-surface-border flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-500/15 flex items-center justify-center text-brand-500">
            <History size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Versions</h3>
            <p className="text-xs text-[color:var(--color-muted)]">Khôi phục nội dung đã lưu</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="h-9 w-9 rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
          aria-label="Close"
        >
          <X size={16} className="mx-auto" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 elite-scrollbar">
        {isLoading ? (
          <div className="rounded-lg border border-surface-border bg-surface-bg p-6 text-sm text-[color:var(--color-muted)]">
            Loading…
          </div>
        ) : versions?.length === 0 ? (
          <div className="rounded-lg border border-surface-border bg-surface-bg p-6 text-sm text-[color:var(--color-muted)]">
            No versions yet.
          </div>
        ) : (
          versions?.map((version, idx) => (
            <div
              key={version.id}
              className="rounded-lg border border-surface-border bg-surface-bg p-4 flex items-start justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                  {format(new Date(version.savedAt), 'HH:mm · MMM dd, yyyy', { locale: enUS })}
                </p>
                <p className="mt-1 text-xs text-[color:var(--color-muted)] flex items-center gap-2">
                  <Clock size={12} />
                  Index {String(idx + 1).padStart(2, '0')}
                </p>
              </div>
              <AppButton
                type="button"
                variant="secondary"
                size="sm"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => onRestore(version.content)}
              >
                Restore
              </AppButton>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

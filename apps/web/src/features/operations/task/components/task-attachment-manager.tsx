'use client';

import React, { useCallback, useRef } from 'react';
import { Download, FileIcon, Loader2, Paperclip, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import type { ProjectTaskAttachmentDTO } from '@superboard/shared';
import { AppButton } from '@/components/ui/app-button';
import {
  useDeleteAttachment,
  useUploadAttachment,
} from '@/features/operations/task/hooks/use-task-attachments';

interface TaskAttachmentManagerProps {
  projectId: string;
  taskId: string;
  attachments: ProjectTaskAttachmentDTO[];
}

export function TaskAttachmentManager({
  projectId,
  taskId,
  attachments = [],
}: TaskAttachmentManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadAttachment, isPending: isUploading } = useUploadAttachment(
    projectId,
    taskId,
  );
  const { mutate: deleteAttachment } = useDeleteAttachment(projectId);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0 && files[0]) {
        uploadAttachment(files[0]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [uploadAttachment],
  );

  const triggerUpload = () => fileInputRef.current?.click();

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <section className="rounded-lg border border-surface-border bg-surface-card shadow-luxe p-[var(--space-6)]">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-brand-50 border border-brand-500/15 flex items-center justify-center text-brand-500">
            <Paperclip size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Attachments</h3>
            <p className="text-xs text-[color:var(--color-muted)]">
              {attachments.length} file{attachments.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        <AppButton
          type="button"
          onClick={triggerUpload}
          disabled={isUploading}
          isLoading={isUploading}
          variant="primary"
          size="sm"
          leftIcon={
            isUploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />
          }
        >
          Upload
        </AppButton>
      </header>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {attachments.length === 0 && !isUploading ? (
        <button
          type="button"
          onClick={triggerUpload}
          className="mt-5 w-full rounded-lg border-2 border-dashed border-surface-border bg-surface-bg px-6 py-10 text-left hover:bg-black/[0.02] transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)]">
              <FileIcon size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">No attachments</p>
              <p className="text-xs text-[color:var(--color-muted)]">Click to upload a file.</p>
            </div>
          </div>
        </button>
      ) : null}

      {attachments.length > 0 ? (
        <div className="mt-5 divide-y divide-surface-border rounded-lg border border-surface-border overflow-hidden">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center gap-4 bg-surface-bg p-4">
              <div className="h-10 w-10 rounded-lg bg-black/[0.03] border border-surface-border flex items-center justify-center text-[color:var(--color-muted)] shrink-0">
                <FileIcon size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p
                  className="truncate text-sm font-semibold text-[color:var(--color-ink)]"
                  title={attachment.name}
                >
                  {attachment.name}
                </p>
                <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                  {formatSize(attachment.size)} · v
                  {format(new Date(attachment.createdAt), 'yyMMdd')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-surface-border bg-surface-bg text-[color:var(--color-muted)] hover:bg-black/[0.03] hover:text-[color:var(--color-ink)] transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Xoá file đính kèm này?')) deleteAttachment(attachment.id);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-sm border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-colors"
                  title="Delete"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

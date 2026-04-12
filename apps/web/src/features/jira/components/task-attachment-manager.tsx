'use client';

import React, { useCallback, useRef } from 'react';
import { Paperclip, X, Download, FileIcon, Loader2, Plus } from 'lucide-react';
import {
  useUploadAttachment,
  useDeleteAttachment,
} from '@/features/jira/hooks/use-task-attachments';
import type { ProjectTaskAttachmentDTO } from '@superboard/shared';
import { format } from 'date-fns';

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
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [uploadAttachment],
  );

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-slate-500" />
          Tệp đính kèm ({attachments.length})
        </h3>
        <button
          type="button"
          onClick={triggerUpload}
          disabled={isUploading}
          className="text-xs flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium disabled:opacity-50"
        >
          {isUploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
          Tải lên
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {attachments.length === 0 && !isUploading && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <Paperclip className="h-8 w-8 text-slate-300" />
          <p className="text-sm text-slate-500">Chưa có tệp đính kèm. Nhấp để tải lên.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group relative flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white shadow-sm transition-all hover:shadow hover:border-brand-300"
          >
            <div className="h-10 w-10 shrink-0 bg-slate-100 rounded flex items-center justify-center">
              <FileIcon className="h-5 w-5 text-slate-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-slate-900" title={attachment.name}>
                {attachment.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatSize(attachment.size)} •{' '}
                {format(new Date(attachment.createdAt), 'dd/MM/yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                title="Tải xuống"
              >
                <Download className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Bạn có chắc muốn xoá tệp đính kèm này?')) {
                    deleteAttachment(attachment.id);
                  }
                }}
                className="p-1.5 hover:bg-rose-50 rounded text-rose-600"
                title="Xoá"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {isUploading && (
          <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50 animate-pulse">
            <div className="h-10 w-10 bg-slate-200 rounded flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

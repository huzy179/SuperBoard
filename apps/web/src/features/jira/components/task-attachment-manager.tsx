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
    <div className="space-y-10 rounded-[3.5rem] border border-white/5 bg-white/[0.01] p-10 backdrop-blur-[60px] shadow-luxe relative overflow-hidden group">
      <div className="absolute inset-0 bg-blue-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <Paperclip className="h-5 w-5 text-white/20 italic" />
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.6em] italic leading-none">
              Asset Vault
            </h3>
            <span className="text-[8px] font-bold text-white/5 uppercase tracking-[0.2em] mt-1.5">
              UNIT_ALLOCATION: {attachments.length}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={triggerUpload}
          disabled={isUploading}
          className="group/btn flex items-center gap-4 px-6 py-3.5 rounded-[1.2rem] bg-white text-slate-950 text-[10px] font-black uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all disabled:opacity-20 shadow-luxe"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 group-hover/btn:rotate-90 transition-transform duration-700" />
          )}
          <span>Transmit</span>
        </button>
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {attachments.length === 0 && !isUploading && (
        <div
          onClick={triggerUpload}
          className="border-2 border-dashed border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-8 cursor-pointer hover:bg-white/[0.02] hover:border-brand-500/20 transition-all group/empty relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-500/[0.01] opacity-0 group-hover/empty:opacity-100 transition-opacity" />
          <div className="w-20 h-20 rounded-[2rem] bg-slate-950 flex items-center justify-center border border-white/5 group-hover/empty:scale-110 group-hover/empty:rotate-6 transition-all shadow-inner">
            <Paperclip className="h-10 w-10 text-white/10 group-hover/empty:text-brand-500 transition-colors" />
          </div>
          <div className="text-center relative z-10">
            <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic">
              VAULT_IDLE
            </p>
            <p className="text-[8px] font-bold text-white/5 uppercase tracking-[0.3em] mt-2">
              DEPOSIT_ASSETS_FOR_ANALYSIS
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 relative z-10">
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className="group/card relative flex items-center gap-8 p-6 border border-white/5 rounded-[2rem] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 transition-all shadow-inner overflow-hidden"
          >
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity" />

            <div className="h-16 w-16 shrink-0 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-center shadow-inner group-hover/card:scale-110 transition-transform duration-700">
              <FileIcon className="h-8 w-8 text-white/10 group-hover/card:text-white/30 transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-base font-black text-white/60 group-hover/card:text-white truncate tracking-tight uppercase italic"
                title={attachment.name}
              >
                {attachment.name}
              </p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
                  {formatSize(attachment.size)}
                </span>
                <div className="h-1 w-1 rounded-full bg-brand-500 shadow-glow-brand" />
                <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.3em]">
                  v.{format(new Date(attachment.createdAt), 'yyMMdd')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-0 group-hover/card:opacity-100 transition-all scale-90 group-hover/card:scale-100">
              <a
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-white/[0.03] hover:bg-white text-white/20 hover:text-slate-950 rounded-2xl transition-all shadow-inner"
                title="Extract Stream"
              >
                <Download className="h-5 w-5" />
              </a>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Permanently terminate this asset link?')) {
                    deleteAttachment(attachment.id);
                  }
                }}
                className="p-4 bg-rose-500/5 hover:bg-rose-500 text-rose-500/30 hover:text-white rounded-2xl transition-all shadow-inner"
                title="Protocol Terminate"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {isUploading && (
          <div className="flex items-center gap-8 p-8 border border-brand-500/20 rounded-[2rem] bg-brand-500/5 animate-pulse shadow-glow-brand/10">
            <div className="h-16 w-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-luxe">
              <Loader2 className="h-8 w-8 animate-spin text-slate-950" />
            </div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-white/10 rounded-full w-2/3"></div>
              <div className="h-2 bg-white/5 rounded-full w-1/3"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

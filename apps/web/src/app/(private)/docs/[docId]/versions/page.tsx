'use client';

import { useParams, useRouter } from 'next/navigation';
import { useDoc, useDocVersions } from '@/features/docs/hooks/use-doc';
import { RichTextEditor } from '@/features/docs/components/RichTextEditor';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ChevronLeft, Clock, RotateCcw, FileText, Check } from 'lucide-react';
import { useState } from 'react';
import type { DocVersion } from '@superboard/shared';

export default function VersionHistoryPage() {
  const params = useParams<{ docId: string }>();
  const router = useRouter();
  const { data: doc, isLoading: docLoading } = useDoc(params.docId);
  const { data: versions, isLoading: versionsLoading } = useDocVersions(params.docId);
  const [selectedVersion, setSelectedVersion] = useState<DocVersion | null>(null);

  if (docLoading || versionsLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  const currentContent = selectedVersion ? selectedVersion.content : doc?.content;
  const isViewingHistory = !!selectedVersion;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-surface-border px-6 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-slate-900 leading-none mb-1">
              Lịch sử phiên bản
            </h1>
            <span className="text-[11px] text-slate-500 font-medium truncate max-w-[200px]">
              {doc?.title}
            </span>
          </div>
        </div>

        {isViewingHistory && (
          <button
            onClick={() => {
              // Logic to restore would go here via a mutation
              alert('Tính năng khôi phục đang được phê duyệt...');
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-600 text-white text-[12px] font-bold shadow-md hover:bg-brand-700 transition-all"
          >
            <RotateCcw size={14} />
            Khôi phục bản này
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Preview Area */}
        <div className="flex-1 overflow-y-auto bg-slate-200/20 p-8 sm:p-12 lg:p-20">
          <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-2xl border border-slate-200 min-h-full overflow-hidden p-12">
            <div className="mb-8">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-4">
                {doc?.title}
              </h2>
              {isViewingHistory && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-full border border-amber-200 w-fit">
                  <Clock size={12} className="text-amber-600" />
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
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
        <aside className="w-80 shrink-0 border-l border-surface-border bg-slate-50 flex flex-col overflow-hidden shadow-sm">
          <div className="px-4 py-4 border-b border-surface-border bg-white/50">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
              Lịch sử chỉnh sửa
            </h3>
            <p className="text-[12px] text-slate-500">Chọn một phiên bản để xem lại nội dung.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {/* Current Version Entry */}
            <button
              onClick={() => setSelectedVersion(null)}
              className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all border text-left ${
                !selectedVersion
                  ? 'bg-white border-brand-200 shadow-sm'
                  : 'border-transparent hover:bg-white/50'
              }`}
            >
              <div
                className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${!selectedVersion ? 'bg-brand-600' : 'bg-slate-200'}`}
              >
                <FileText
                  size={12}
                  className={!selectedVersion ? 'text-white' : 'text-slate-500'}
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-slate-900">Hiện tại</span>
                  <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-1 rounded uppercase tracking-tighter">
                    Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Tài liệu đang được chỉnh sửa</p>
              </div>
            </button>

            {/* Historical Versions */}
            {versions?.map((v, i) => (
              <button
                key={v.id}
                onClick={() => setSelectedVersion(v)}
                className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all border text-left ${
                  selectedVersion?.id === v.id
                    ? 'bg-white border-brand-200 shadow-sm'
                    : 'border-transparent hover:bg-white/50'
                }`}
              >
                <div
                  className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${selectedVersion?.id === v.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                >
                  {selectedVersion?.id === v.id ? <Check size={12} /> : <Clock size={12} />}
                </div>
                <div className="min-w-0">
                  <span className="text-[13px] font-bold text-slate-900 block truncate leading-none mb-1">
                    Bản lưu {versions.length - i}
                  </span>
                  <p className="text-[11px] text-slate-500 uppercase font-black tracking-widest leading-none">
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
